import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { getActiveUser } from '../../shared/moderation.ts';
import { renderNotification } from '../../shared/i18n.ts';

// Creates a user-to-user notification. The sender identity is always derived
// server-side from the authenticated caller, so a member can never spoof
// another member, an admin, or the platform. System (moderation) types are
// reserved for admins. Notification records themselves are only creatable by
// backend functions (admin-only entity rule), so this is the single member
// entry point.

const MEMBER_TYPES = [
  'new_negotiation', 'new_message', 'new_offer', 'counter_offer',
  'offer_accepted', 'offer_declined', 'agreement_created',
  'agreement_confirmed', 'work_completed', 'rating_received',
  'negotiation_closed', 'item_available', 'listing_prefs_changed'
];
const SYSTEM_TYPES = ['moderation_resolved', 'moderation_warning'];
const RELATED_TYPES = ['negotiation', 'agreement', 'item', 'message'];

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const { user, status, error } = await getActiveUser(base44);
    if (!user) return Response.json({ error }, { status });

    const body = await req.json();
    const toUserId = String(body.user_id || '');
    const type = String(body.type || '');
    const title = String(body.title || '').slice(0, 200);
    const message = String(body.message || '').slice(0, 1000);
    const isAdmin = user.role === 'admin';

    if (!toUserId || !title || !message) {
      return Response.json({ error: 'user_id, title and message are required' }, { status: 400 });
    }
    if (SYSTEM_TYPES.includes(type) && !isAdmin) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (!MEMBER_TYPES.includes(type) && !SYSTEM_TYPES.includes(type)) {
      return Response.json({ error: 'Invalid notification type' }, { status: 400 });
    }

    // Only in-app relative links — never external or protocol-relative URLs
    let linkUrl = body.link_url ? String(body.link_url) : null;
    if (linkUrl && !(linkUrl.startsWith('/') && !linkUrl.startsWith('//') && !linkUrl.includes('\\'))) {
      return Response.json({ error: 'link_url must be an in-app path' }, { status: 400 });
    }

    const relatedType = RELATED_TYPES.includes(body.related_type) ? body.related_type : null;

    const db = base44.asServiceRole.entities;

    let recipient = null;
    try {
      const recipients = await db.User.filter({ id: toUserId });
      recipient = recipients[0];
    } catch (e) {
      recipient = null;
    }
    if (!recipient) {
      // Uniform response: indistinguishable from a blocked send, so callers
      // cannot probe which user ids exist.
      return Response.json({ success: true, sent: false });
    }

    // Localized send: when the caller passes an i18n key + vars, the title and
    // message are rendered from shared templates in the recipient's saved
    // language (default English), overriding the raw English text.
    const recipientLang = (recipient as any)?.language === 'es' ? 'es' : 'en';
    let finalTitle = title;
    let finalMessage = message;
    if (body.i18n && typeof body.i18n.key === 'string') {
      const rendered = renderNotification(recipientLang, body.i18n.key, body.i18n.vars || {});
      if (rendered) {
        finalTitle = rendered.title.slice(0, 200);
        finalMessage = rendered.message.slice(0, 1000);
      }
    }

    // Rate limits (admins exempt) to stop notification spam/flooding.
    if (!isAdmin) {
      try {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        const recentFromSender = await db.Notification.filter({ from_user_id: user.id, created_date: { $gte: oneHourAgo } });
        if (recentFromSender.length >= 20) {
          return Response.json({ error: 'Too many notifications sent recently. Please try again later.' }, { status: 429 });
        }
        if (recentFromSender.filter((n) => n.user_id === toUserId).length >= 5) {
          return Response.json({ error: 'Too many notifications sent to this member recently.' }, { status: 429 });
        }
      } catch (e) {
        // Rate limiting is best-effort; never block legitimate sends on errors.
      }
    }

    // Respect blocks: if the recipient blocked the sender, silently skip
    let blocked = false;
    try {
      const blocks = await db.BlockedUser.filter({ blocker_id: toUserId, blocked_id: user.id });
      blocked = blocks.length > 0;
    } catch (e) {
      blocked = false;
    }
    if (blocked) {
      return Response.json({ success: true, sent: false, reason: 'blocked' });
    }

    const created = await db.Notification.create({
      user_id: toUserId,
      type,
      title: finalTitle,
      message: finalMessage,
      related_id: body.related_id ? String(body.related_id) : null,
      related_type: relatedType,
      link_url: linkUrl,
      from_user_id: user.id,
      from_user_name: user.full_name
    });

    return Response.json({ success: true, sent: true, id: created.id });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}