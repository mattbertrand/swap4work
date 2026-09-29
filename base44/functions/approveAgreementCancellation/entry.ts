import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { getActiveUser, loadVerifiedAgreement, applyModerationFlags } from '../../shared/moderation.ts';

// Approves the OTHER party's pending cancellation request for an agreement.
// All karma, cancellation-count and auto-suspension bookkeeping happens here,
// server-side, so reputation fields can't be written from the client.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const { user, status, error } = await getActiveUser(base44);
    if (!user) return Response.json({ error }, { status });

    const body = await req.json();
    const agreementId = String(body.agreement_id || '');
    if (!agreementId) {
      return Response.json({ error: 'agreement_id is required' }, { status: 400 });
    }

    const db = base44.asServiceRole.entities;
    const { agreement, status: loadStatus, error: loadError } = await loadVerifiedAgreement(db, agreementId);
    if (!agreement) return Response.json({ error: loadError }, { status: loadStatus });

    if (user.id !== agreement.offerer_id && user.id !== agreement.worker_id && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // The pending request must exist in the server-written CancellationRequest
    // ledger — the copy on the Agreement is client-writable display data and
    // must never be trusted (a forged requested_by would let a worker frame
    // the offerer for a mid-agreement cancellation penalty).
    let request = null;
    try {
      const pendingRequests = await db.CancellationRequest.filter({ agreement_id: agreementId, status: 'pending' });
      request = pendingRequests[0];
    } catch (e) {
      request = null;
    }
    if (!request || request.requested_by === user.id) {
      return Response.json({ error: 'There is no pending cancellation request from the other party' }, { status: 400 });
    }
    if (agreement.status !== 'locked' && agreement.status !== 'in_progress') {
      return Response.json({ error: 'This agreement cannot be cancelled right now' }, { status: 400 });
    }

    // Partial karma credit for work actually logged (server-side figures only)
    const logs = await db.TimeLog.filter({ agreement_id: agreementId });
    const hoursLogged = logs.reduce((sum, l) => sum + (l.hours || 0), 0);
    const agreedHours = agreement.agreed_hours || 1;
    if (hoursLogged > 0) {
      const completionPercentage = Math.min((hoursLogged / agreedHours) * 100, 100);
      const partialKarma = Math.floor((completionPercentage / 100) * 10);
      await db.KarmaTransaction.create({
        user_id: agreement.worker_id,
        user_name: agreement.worker_name,
        type: 'gain',
        reason: 'partial_milestone_credit',
        points: partialKarma,
        agreement_id: agreementId,
        description: `Partial credit for ${completionPercentage.toFixed(1)}% completion (${hoursLogged}/${agreedHours} hours)`
      });
      const workers = await db.User.filter({ id: agreement.worker_id });
      if (workers[0]) {
        await db.User.update(agreement.worker_id, {
          karma_points: (workers[0].karma_points || 0) + partialKarma
        });
      }

      // Penalize the offerer if they initiated the cancellation after work started
      if (request.requested_by === agreement.offerer_id) {
        await db.KarmaTransaction.create({
          user_id: agreement.offerer_id,
          user_name: agreement.offerer_name,
          type: 'loss',
          reason: 'mid_agreement_cancellation',
          points: -20,
          agreement_id: agreementId,
          description: 'Mid-agreement cancellation after work started'
        });
        const offerers = await db.User.filter({ id: agreement.offerer_id });
        if (offerers[0]) {
          const newKarma = (offerers[0].karma_points || 0) - 20;
          const updateData = {
            karma_points: newKarma,
            cancellation_count: (offerers[0].cancellation_count || 0) + 1
          };
          // Auto-suspend on negative karma. The enforced flag lives in the
          // server-only ModerationStatus ledger; the User field is display-only.
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
      }
    }

    await db.CancellationRequest.update(request.id, { status: 'approved' });
    await db.Agreement.update(agreementId, {
      status: 'cancelled_mutual',
      cancellation_request: { ...request, status: 'approved' },
      history: [...(agreement.history || []), {
        timestamp: new Date().toISOString(),
        actor_id: user.id,
        actor_name: user.full_name,
        action: 'cancellation_approved',
        message: 'Mutual cancellation approved'
      }]
    });

    await db.Item.update(agreement.item_id, {
      is_reserved: false,
      reserved_for_agreement_id: null,
      status: 'active'
    });

    return Response.json({ success: true, status: 'cancelled_mutual' });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}