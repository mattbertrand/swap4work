import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { getActiveUser, loadVerifiedAgreement } from '../../shared/moderation.ts';

// Records a mutual-cancellation request for a locked agreement in the
// server-only CancellationRequest ledger. requested_by is derived from the
// authenticated caller, so the client-writable copy on the Agreement can never
// be used to forge a request in someone else's name (e.g. to frame the
// offerer for a mid-agreement cancellation penalty).
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const { user, status, error } = await getActiveUser(base44);
    if (!user) return Response.json({ error }, { status });

    const body = await req.json();
    const agreementId = String(body.agreement_id || '');
    const reason = String(body.reason || '').slice(0, 500).trim();
    if (!agreementId || !reason) {
      return Response.json({ error: 'agreement_id and reason are required' }, { status: 400 });
    }

    const db = base44.asServiceRole.entities;
    const { agreement, status: loadStatus, error: loadError } = await loadVerifiedAgreement(db, agreementId);
    if (!agreement) return Response.json({ error: loadError }, { status: loadStatus });

    if (user.id !== agreement.offerer_id && user.id !== agreement.worker_id && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (agreement.status !== 'locked' && agreement.status !== 'in_progress') {
      return Response.json({ error: 'This agreement cannot be cancelled right now' }, { status: 400 });
    }

    // Only one live request per agreement
    let pending = null;
    try {
      const pendingRequests = await db.CancellationRequest.filter({ agreement_id: agreementId, status: 'pending' });
      pending = pendingRequests[0];
    } catch (e) {
      pending = null;
    }
    if (pending) {
      return Response.json({ error: 'A cancellation request is already pending for this agreement' }, { status: 409 });
    }

    const now = new Date();
    const requestData = {
      status: 'pending',
      requested_by: user.id,
      requested_by_name: user.full_name,
      reason,
      requested_date: now.toISOString(),
      expires_at: new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString()
    };

    await db.CancellationRequest.create({ agreement_id: agreementId, ...requestData });

    // Mirror onto the agreement for UI display only — approval logic re-reads
    // the server ledger and never trusts this copy.
    await db.Agreement.update(agreementId, {
      cancellation_request: { ...requestData, status: 'pending_mutual' },
      history: [...(agreement.history || []), {
        timestamp: now.toISOString(),
        actor_id: user.id,
        actor_name: user.full_name,
        action: 'cancellation_requested',
        message: `${user.full_name} requested cancellation: ${reason}`
      }]
    });

    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}