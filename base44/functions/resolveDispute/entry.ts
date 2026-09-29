import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { getActiveUser, applyModerationFlags } from '../../shared/moderation.ts';

// Admin-only dispute resolution. All privileged writes (Dispute resolution
// record, karma transactions, user karma/suspension, agreement and item
// state) happen server-side with the service role, so a dispute opener can
// never forge an admin's resolution from the client. The Dispute entity's
// update rule is admin-only, making this the only path to resolve one.

const ACTIONS = ['approve_mutual', 'award_partial', 'strike_offerer'];

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const { user, status, error } = await getActiveUser(base44);
    if (!user) return Response.json({ error }, { status });
    if (user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const disputeId = String(body.dispute_id || '');
    const action = String(body.action || '');
    const resolution = String(body.resolution || '').slice(0, 2000);
    const partialCredit = Number(body.partial_credit);
    if (!disputeId) {
      return Response.json({ error: 'dispute_id is required' }, { status: 400 });
    }
    if (!ACTIONS.includes(action)) {
      return Response.json({ error: 'Invalid action' }, { status: 400 });
    }

    const db = base44.asServiceRole.entities;
    let dispute = null;
    try {
      const disputes = await db.Dispute.filter({ id: disputeId });
      dispute = disputes[0];
    } catch (e) {
      dispute = null;
    }
    if (!dispute) return Response.json({ error: 'Dispute not found' }, { status: 404 });
    if (dispute.status === 'resolved' || dispute.status === 'closed') {
      return Response.json({ error: 'Dispute is already resolved' }, { status: 400 });
    }

    const agreements = await db.Agreement.filter({ id: dispute.agreement_id });
    const agreement = agreements[0];
    if (!agreement) {
      return Response.json({ error: 'Agreement not found' }, { status: 404 });
    }

    const disputeUpdate = {
      status: 'resolved',
      resolved_by: user.id,
      resolved_by_name: user.full_name,
      resolved_date: new Date().toISOString(),
      resolution,
      karma_adjustments: []
    };

    if (action === 'award_partial') {
      if (!(partialCredit > 0 && partialCredit <= 100)) {
        return Response.json({ error: 'partial_credit must be between 1 and 100' }, { status: 400 });
      }
      disputeUpdate.partial_credit_awarded = partialCredit;

      const karmaPoints = Math.floor((partialCredit / 100) * 10);
      await db.KarmaTransaction.create({
        user_id: agreement.worker_id,
        user_name: agreement.worker_name,
        type: 'gain',
        reason: 'partial_milestone_credit',
        points: karmaPoints,
        agreement_id: agreement.id,
        description: `Admin awarded ${partialCredit}% partial credit in dispute resolution`
      });

      const workers = await db.User.filter({ id: agreement.worker_id });
      if (workers[0]) {
        await db.User.update(agreement.worker_id, {
          karma_points: (workers[0].karma_points || 0) + karmaPoints
        });
      }

      disputeUpdate.karma_adjustments.push({
        user_id: agreement.worker_id,
        points: karmaPoints,
        reason: 'Partial credit awarded'
      });
    } else if (action === 'strike_offerer') {
      await db.KarmaTransaction.create({
        user_id: agreement.offerer_id,
        user_name: agreement.offerer_name,
        type: 'loss',
        reason: 'dispute_violation',
        points: -20,
        agreement_id: agreement.id,
        description: 'Admin penalty for dispute violation'
      });

      const offerers = await db.User.filter({ id: agreement.offerer_id });
      if (offerers[0]) {
        const newKarma = (offerers[0].karma_points || 0) - 20;
        const updateData = {
          karma_points: newKarma,
          cancellation_count: (offerers[0].cancellation_count || 0) + 1
        };
        if (newKarma < 0) {
          updateData.is_suspended = true;
          updateData.suspension_end_date = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
          await applyModerationFlags(db, agreement.offerer_id, {
            is_suspended: true,
            suspension_end_date: updateData.suspension_end_date
          });
        }
        await db.User.update(agreement.offerer_id, updateData);
      }

      disputeUpdate.karma_adjustments.push({
        user_id: agreement.offerer_id,
        points: -20,
        reason: 'Dispute violation strike'
      });
    } else if (action === 'approve_mutual') {
      await db.Agreement.update(agreement.id, { status: 'cancelled_mutual' });
      await db.Item.update(agreement.item_id, {
        is_reserved: false,
        reserved_for_agreement_id: null,
        status: 'active'
      });
    }

    await db.Dispute.update(disputeId, disputeUpdate);
    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}