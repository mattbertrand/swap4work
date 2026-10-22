import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { getAllowedOfferTypes } from '../../shared/exchange.ts';
import { renderNotification, listingTypeLabel } from '../../shared/i18n.ts';

// Creates a negotiation between a requester (bidder) and a listing owner
// (offerer). Server-side because eligibility, ownership, blocks and the
// negotiation limits must be enforced in the backend — hiding options in the
// UI is not sufficient. The negotiation is created with a full snapshot of
// both sides: target listing, its type, and the requester's offered listing
// and its type.

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const targetId = String(body.target_listing_id || '');
    const offeredId = String(body.offered_listing_id || '');
    if (!targetId || !offeredId) {
      return Response.json({ error: 'target_listing_id and offered_listing_id are required' }, { status: 400 });
    }

    const hours = Number(body.hours);
    if (!Number.isFinite(hours) || hours < (5 / 60) || hours > 1000) {
      return Response.json({ error: 'Please enter a valid work time (at least 5 minutes).' }, { status: 400 });
    }

    const workType = body.work_type ? String(body.work_type).slice(0, 200) : "";
    const message = body.message ? String(body.message).slice(0, 2000) : "";

    const targets = await base44.entities.Item.filter({ id: targetId });
    const target = targets[0];
    if (!target) return Response.json({ error: 'Listing not found' }, { status: 404 });
    if (target.offerer_id === user.id) {
      return Response.json({ error: 'You cannot negotiate on your own listing.' }, { status: 400 });
    }
    if (target.status !== 'active' || target.is_hidden) {
      return Response.json({ error: 'This listing is not available for new negotiations.' }, { status: 400 });
    }

    const offeredResults = await base44.entities.Item.filter({ id: offeredId });
    const offered = offeredResults[0];
    if (!offered || offered.offerer_id !== user.id) {
      return Response.json({ error: 'The offered listing was not found or does not belong to you.' }, { status: 403 });
    }
    if (offered.status !== 'active' || offered.is_hidden) {
      return Response.json({ error: 'The listing you want to offer is not active.' }, { status: 400 });
    }

    // Eligibility: the target owner's return-type preference decides which
    // listing types may be offered in exchange.
    const offeredType = offered.listing_type === 'service' ? 'service' : 'item';
    const allowed = getAllowedOfferTypes(target);
    if (!allowed.includes(offeredType)) {
      return Response.json({
        error: `This owner wants ${allowed.join(' or ')} in return, so ${offeredType === 'item' ? 'an' : 'a'} ${offeredType} listing cannot be offered here.`
      }, { status: 400 });
    }

    // Blocks in either direction stop a negotiation.
    const blocksOnOwner = await base44.entities.BlockedUser.filter({ blocker_id: target.offerer_id, blocked_id: user.id });
    const blocksOnUser = await base44.entities.BlockedUser.filter({ blocker_id: user.id, blocked_id: target.offerer_id });
    if (blocksOnOwner.length > 0 || blocksOnUser.length > 0) {
      return Response.json({ error: 'You cannot negotiate with this member.' }, { status: 403 });
    }

    // Service-role counts: active negotiations include other members' rows,
    // which the user-scoped client cannot read.
    const serviceDb = base44.asServiceRole.entities;

    const activeForTarget = await serviceDb.Negotiation.filter({ item_id: target.id, status: { $in: ['active', 'accepted'] } });
    if (activeForTarget.length >= 3) {
      return Response.json({ error: 'This listing has reached its negotiation limit.' }, { status: 400 });
    }

    let capacity = 10;
    try {
      const workers = await serviceDb.Worker.filter({ user_id: target.offerer_id });
      if (workers[0]?.max_concurrent_offers) capacity = workers[0].max_concurrent_offers;
    } catch (e) { /* capacity check is best-effort */ }
    const ownerActive = await serviceDb.Negotiation.filter({ offerer_id: target.offerer_id, status: { $in: ['active', 'accepted'] } });
    if (ownerActive.length >= capacity) {
      return Response.json({ error: 'This member is currently at their maximum number of active negotiations.' }, { status: 400 });
    }

    // The target owner is the recipient of the offer — messages and the
    // notification render in their saved language (default English).
    let ownerLang = 'en';
    try {
      const owners = await serviceDb.User.filter({ id: target.offerer_id });
      if (owners[0]?.language === 'es') ownerLang = 'es';
    } catch (e) { /* language lookup is best-effort */ }

    const now = new Date().toISOString();
    const negotiation = await base44.entities.Negotiation.create({
      item_id: target.id,
      item_title: target.title,
      offerer_id: target.offerer_id,
      offerer_name: target.offerer_name,
      bidder_id: user.id,
      bidder_name: user.full_name,
      initial_offer_hours: hours,
      work_type: workType,
      offered_listing_id: offered.id,
      offered_listing_title: offered.title,
      offered_listing_type: offeredType,
      target_listing_type: target.listing_type === 'service' ? 'service' : 'item',
      status: 'active',
      current_offer_by: user.id,
      offer_history: [{
        offered_by: user.id,
        offered_by_name: user.full_name,
        hours,
        work_type: workType,
        message,
        timestamp: now
      }],
      last_activity: now,
      expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
    });

    const offeredLabel = listingTypeLabel(offeredType, ownerLang);
    const offerIntro = ownerLang === 'es'
      ? `${user.full_name} ofreció su ${offeredLabel} "${offered.title}" a cambio de "${target.title}".`
      : `${user.full_name} offered their ${offeredLabel} "${offered.title}" in exchange for "${target.title}".`;
    const workLabel = ownerLang === 'es' ? 'Trabajo' : 'Work';
    await base44.entities.Message.create({
      negotiation_id: negotiation.id,
      from_user_id: user.id,
      from_user_name: user.full_name,
      to_user_id: target.offerer_id,
      text: offerIntro +
        (workType ? `\n\n${workLabel}: ${workType}` : '') +
        (message ? `\n\n${message}` : ''),
      message_type: 'offer',
      proposal_hours: hours
    });

    // Notification is best-effort: never fail the negotiation over it.
    // Sent with an i18n key so sendNotification renders it in the
    // recipient's saved language.
    try {
      await base44.functions.invoke('sendNotification', {
        user_id: target.offerer_id,
        type: 'new_negotiation',
        title: 'New negotiation started',
        message: `${user.full_name} offered their ${listingTypeLabel(offeredType, 'en')} "${offered.title}" in exchange for "${target.title}"`,
        i18n: {
          key: 'new_negotiation',
          vars: {
            name: user.full_name,
            offered_label: listingTypeLabel(offeredType, ownerLang),
            offered_title: offered.title,
            target_title: target.title
          }
        },
        related_id: negotiation.id,
        related_type: 'negotiation',
        link_url: `/negotiation?id=${negotiation.id}`
      });
    } catch (e) { /* best-effort */ }

    return Response.json({ negotiation });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}