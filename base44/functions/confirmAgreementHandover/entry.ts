import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { getActiveUser } from '../../shared/moderation.ts';

// Confirms the handover for the caller; when both parties have confirmed it
// completes the agreement and updates reputation stats server-side so
// hours/trade counters can't be inflated from the client.
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
    let agreement = null;
    try {
      const agreements = await db.Agreement.filter({ id: agreementId });
      agreement = agreements[0];
    } catch (e) {
      agreement = null;
    }
    if (!agreement) return Response.json({ error: 'Agreement not found' }, { status: 404 });

    const isOfferer = user.id === agreement.offerer_id;
    const isWorker = user.id === agreement.worker_id;
    if (!isOfferer && !isWorker && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (agreement.status === 'completed') {
      return Response.json({ success: true, both_confirmed: true });
    }

    await db.Agreement.update(agreementId, isOfferer
      ? { offerer_handover_confirmed: true }
      : { worker_handover_confirmed: true });

    const updated = (await db.Agreement.filter({ id: agreementId }))[0];
    const bothConfirmed = updated.offerer_handover_confirmed && updated.worker_handover_confirmed;
    if (!bothConfirmed) {
      return Response.json({ success: true, both_confirmed: false });
    }

    await db.Agreement.update(agreementId, {
      status: 'completed',
      completion_date: new Date().toISOString()
    });

    // Stats are recomputed server-side from the agreement record
    const hoursToAdd = updated.hours_logged || updated.agreed_hours;
    for (const memberId of [agreement.offerer_id, agreement.worker_id]) {
      const workerRows = await db.Worker.filter({ user_id: memberId });
      if (workerRows[0]) {
        await db.Worker.update(workerRows[0].id, {
          hours_completed: (workerRows[0].hours_completed || 0) + hoursToAdd,
          completed_trades: (workerRows[0].completed_trades || 0) + 1
        });
      }
      const userRows = await db.User.filter({ id: memberId });
      if (userRows[0]) {
        await db.User.update(memberId, {
          hours_completed: (userRows[0].hours_completed || 0) + hoursToAdd,
          completed_trades: (userRows[0].completed_trades || 0) + 1
        });
      }
    }

    const otherUserId = isOfferer ? agreement.worker_id : agreement.offerer_id;
    await db.Notification.create({
      user_id: otherUserId,
      type: 'agreement_confirmed',
      title: 'Agreement completed!',
      message: `The handover for ${agreement.item_title} has been confirmed by both parties`,
      related_id: agreementId,
      related_type: 'agreement',
      link_url: `/agreementdetail?id=${agreementId}`,
      from_user_id: user.id,
      from_user_name: user.full_name
    });

    return Response.json({ success: true, both_confirmed: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}