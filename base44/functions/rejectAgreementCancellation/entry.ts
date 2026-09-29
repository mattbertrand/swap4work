import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { getActiveUser, loadVerifiedAgreement } from '../../shared/moderation.ts';

// Rejects the other party's pending cancellation request. Pending state is
// tracked in the server-only CancellationRequest ledger, so only the party the
// request was addressed to can reject it.
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

    let pending = null;
    try {
      const pendingRequests = await db.CancellationRequest.filter({ agreement_id: agreementId, status: 'pending' });
      pending = pendingRequests[0];
    } catch (e) {
      pending = null;
    }
    if (!pending || pending.requested_by === user.id) {
      return Response.json({ error: 'There is no pending cancellation request from the other party' }, { status: 400 });
    }

    await db.CancellationRequest.update(pending.id, { status: 'rejected' });

    const now = new Date().toISOString();
    await db.Agreement.update(agreementId, {
      cancellation_request: { ...(agreement.cancellation_request || {}), status: 'rejected' },
      history: [...(agreement.history || []), {
        timestamp: now,
        actor_id: user.id,
        actor_name: user.full_name,
        action: 'cancellation_rejected',
        message: 'Cancellation request rejected'
      }]
    });

    return Response.json({ success: true, status: 'rejected' });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}