import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { getActiveUser, loadVerifiedAgreement } from '../../shared/moderation.ts';
import { prepareNotification } from '../../shared/notificationLocalization.ts';

// Confirms the handover for the caller. Trust decisions are kept in
// server-side HandoverConfirmation records that only backend functions can
// write — the client-writable confirmation flags on the Agreement are
// display-only. Completion credits hours derived from logged TimeLog
// entries, never from client-set agreement fields.
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

    const isOfferer = user.id === agreement.offerer_id;
    const isWorker = user.id === agreement.worker_id;
    if (!isOfferer && !isWorker && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (agreement.status === 'completed') {
      return Response.json({ success: true, both_confirmed: true });
    }

    // Server-side confirmation record (only backend functions can write these)
    const existing = await db.HandoverConfirmation.filter({ agreement_id: agreementId, user_id: user.id });
    if (!existing[0]) {
      await db.HandoverConfirmation.create({
        agreement_id: agreementId,
        user_id: user.id,
        confirmed_date: new Date().toISOString()
      });
    }

    // Keep the display flags in sync for the UI
    await db.Agreement.update(agreementId, isOfferer
      ? { offerer_handover_confirmed: true }
      : { worker_handover_confirmed: true });

    const confirmations = await db.HandoverConfirmation.filter({ agreement_id: agreementId });
    const confirmedIds = new Set(confirmations.map((c) => c.user_id));
    const bothConfirmed = confirmedIds.has(agreement.offerer_id) && confirmedIds.has(agreement.worker_id);
    if (!bothConfirmed) {
      return Response.json({ success: true, both_confirmed: false });
    }

    await db.Agreement.update(agreementId, {
      status: 'completed',
      completion_date: new Date().toISOString()
    });

    // Hours credited are derived from logged time entries only, with
    // server-side clamps: each entry is capped at 12h and the total can never
    // exceed the agreed hours, so forged TimeLog records cannot inflate
    // public statistics.
    const logs = await db.TimeLog.filter({ agreement_id: agreementId });
    const loggedHours = logs.reduce(
      (sum, l) => sum + Math.min(Math.max(Number(l.hours) || 0, 0), 12), 0);
    const hoursToAdd = Math.min(loggedHours, agreement.agreed_hours || 0);
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
    await db.Notification.create(await prepareNotification(db, {
      user_id: otherUserId,
      type: 'agreement_confirmed',
      title: 'Agreement completed!',
      message: `The handover for ${agreement.item_title} has been confirmed by both parties`,
      related_id: agreementId,
      related_type: 'agreement',
      link_url: `/agreementdetail?id=${agreementId}`,
      from_user_id: user.id,
      from_user_name: user.full_name
    }));

    return Response.json({ success: true, both_confirmed: true, hours_credited: hoursToAdd });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}