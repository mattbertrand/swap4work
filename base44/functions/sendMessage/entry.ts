import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { getActiveUser } from '../../shared/moderation.ts';

const MESSAGE_TYPES = ['text', 'proposal', 'inspection_request', 'system', 'offer'];

// Sends a message between members. Blocks are enforced server-side in both
// directions, and the sender identity is always taken from the authenticated
// user, so a blocked member can't reach their target by calling the entity
// API directly.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const { user, status, error } = await getActiveUser(base44);
    if (!user) return Response.json({ error }, { status });

    const body = await req.json();
    const toUserId = String(body.to_user_id || '');
    const text = String(body.text || '').slice(0, 2000).trim();
    if (!toUserId) {
      return Response.json({ error: 'to_user_id is required' }, { status: 400 });
    }
    if (!text) {
      return Response.json({ error: 'Message text is required' }, { status: 400 });
    }
    if (toUserId === user.id) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
    const messageType = MESSAGE_TYPES.includes(body.message_type) ? body.message_type : 'text';
    let proposalHours = null;
    if (messageType === 'proposal') {
      const n = Number(body.proposal_hours);
      if (Number.isFinite(n) && n >= 0 && n <= 10000) proposalHours = n;
    }

    const db = base44.asServiceRole.entities;

    // Messages are user-facing: store the name shortened (first name + last initial)
    const nameParts = String(user.full_name || '').trim().split(/\s+/);
    const shortName = nameParts.length > 1
      ? `${nameParts[0]} ${nameParts[nameParts.length - 1][0].toUpperCase()}.`
      : (nameParts[0] || '');

    // Enforce blocks in either direction
    const blocksA = await db.BlockedUser.filter({ blocker_id: user.id, blocked_id: toUserId });
    const blocksB = await db.BlockedUser.filter({ blocker_id: toUserId, blocked_id: user.id });
    if (blocksA[0] || blocksB[0]) {
      return Response.json({ error: "You can't exchange messages with this person." }, { status: 403 });
    }

    // When tied to a thread, the sender must be a participant of it
    const payload = {
      from_user_id: user.id,
      from_user_name: shortName,
      to_user_id: toUserId,
      text,
      message_type: messageType
    };
    if (proposalHours !== null) payload.proposal_hours = proposalHours;
    if (body.negotiation_id) {
      const negotiationId = String(body.negotiation_id);
      const negotiations = await db.Negotiation.filter({ id: negotiationId });
      const negotiation = negotiations[0];
      if (!negotiation || (user.id !== negotiation.offerer_id && user.id !== negotiation.bidder_id)) {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }
      payload.negotiation_id = negotiationId;
    }
    if (body.agreement_id) {
      const agreementId = String(body.agreement_id);
      const agreements = await db.Agreement.filter({ id: agreementId });
      const agreement = agreements[0];
      if (!agreement || (user.id !== agreement.offerer_id && user.id !== agreement.worker_id)) {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }
      payload.agreement_id = agreementId;
    }
    if (body.item_id) payload.item_id = String(body.item_id);

    const message = await db.Message.create(payload);

    return Response.json({ success: true, message });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}