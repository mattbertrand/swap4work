import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { prepareNotification } from '../../shared/notificationLocalization.ts';

const IN_PROGRESS_STATUSES = ['proposed', 'locked', 'in_progress', 'ready_for_handover', 'disputed'];

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const admin = await base44.auth.me();
    if (!admin) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (admin.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const userId = body.user_id;
    // Strict mode validation: only explicit 'preview' or 'execute' are accepted,
    // so an unexpected value can never fall through to deletion.
    const mode = body.mode === 'execute' ? 'execute' : body.mode === 'preview' ? 'preview' : null;
    const reason = body.reason || '';
    if (!mode) return Response.json({ error: 'mode must be "preview" or "execute"' }, { status: 400 });
    if (!userId) return Response.json({ error: 'user_id is required' }, { status: 400 });
    if (userId === admin.id) return Response.json({ error: 'You cannot delete your own account' }, { status: 400 });

    const db = base44.asServiceRole.entities;

    // ---- Gather everything needed for the preview and the deletion ----
    const [itemsAsOfferer, agreementsAsOfferer, agreementsAsWorker] = await Promise.all([
      db.Item.filter({ offerer_id: userId }),
      db.Agreement.filter({ offerer_id: userId }),
      db.Agreement.filter({ worker_id: userId }),
    ]);

    const agreements = [];
    const seenAgreementIds = new Set();
    for (const a of [...agreementsAsOfferer, ...agreementsAsWorker]) {
      if (!seenAgreementIds.has(a.id)) {
        seenAgreementIds.add(a.id);
        agreements.push(a);
      }
    }

    const activeAgreements = agreements.filter(a => IN_PROGRESS_STATUSES.includes(a.status));
    const keptAgreements = agreements.filter(a => !IN_PROGRESS_STATUSES.includes(a.status));
    const activeAgreementIds = activeAgreements.map(a => a.id);
    const itemIds = itemsAsOfferer.map(i => i.id);

    // Counterparties of cancelled agreements (one notification each)
    const counterpartiesMap = {};
    for (const a of activeAgreements) {
      const isDeletedUserOfferer = a.offerer_id === userId;
      const cId = isDeletedUserOfferer ? a.worker_id : a.offerer_id;
      const cName = isDeletedUserOfferer ? a.worker_name : a.offerer_name;
      if (!cId || cId === userId) continue;
      if (!counterpartiesMap[cId]) {
        counterpartiesMap[cId] = { id: cId, name: cName, item_titles: [], agreement_ids: [] };
      }
      if (a.item_title) counterpartiesMap[cId].item_titles.push(a.item_title);
      counterpartiesMap[cId].agreement_ids.push(a.id);
    }
    const counterparties = Object.values(counterpartiesMap);

    const [ratingsGiven, ratingsReceived, messagesSent, messagesReceived, notificationsOwn,
           waitlistOwn, karmaOwn, termsOwn, reportsFiled, blockedByThem, blockedThem, workerProfile] = await Promise.all([
      db.Rating.filter({ from_user_id: userId }),
      db.Rating.filter({ to_user_id: userId }),
      db.Message.filter({ from_user_id: userId }),
      db.Message.filter({ to_user_id: userId }),
      db.Notification.filter({ user_id: userId }),
      db.ItemWaitlist.filter({ user_id: userId }),
      db.KarmaTransaction.filter({ user_id: userId }),
      db.TermsAcceptance.filter({ user_id: userId }),
      db.Report.filter({ reporter_id: userId }),
      db.BlockedUser.filter({ blocker_id: userId }),
      db.BlockedUser.filter({ blocked_id: userId }),
      db.Worker.filter({ user_id: userId }),
    ]);

    let waitlistOnItems = [];
    if (itemIds.length > 0) {
      waitlistOnItems = await db.ItemWaitlist.filter({ item_id: { $in: itemIds } });
    }

    const preview = {
      mode: 'preview',
      user_id: userId,
      will_delete: {
        listings: itemsAsOfferer.length,
        worker_profile: workerProfile.length > 0 ? 1 : 0,
        messages: messagesSent.length + messagesReceived.length,
        notifications: notificationsOwn.length,
        waitlist_entries: waitlistOwn.length + waitlistOnItems.length,
        blocked_user_entries: blockedByThem.length + blockedThem.length,
        terms_acceptances: termsOwn.length,
        reviews_given: ratingsGiven.length,
        reviews_received: ratingsReceived.length,
        karma_transactions: karmaOwn.length,
        reports_filed: reportsFiled.length,
        in_progress_agreements: activeAgreements.length,
      },
      will_keep: {
        completed_agreements: keptAgreements.length,
      },
      counterparties: counterparties,
    };

    if (mode === 'preview') return Response.json(preview);

    // ---- Execute the deletion ----

    // 1. Records tied to cancelled in-progress agreements
    if (activeAgreementIds.length > 0) {
      await db.Milestone.deleteMany({ agreement_id: { $in: activeAgreementIds } });
      await db.TimeLog.deleteMany({ agreement_id: { $in: activeAgreementIds } });
      await db.Message.deleteMany({ agreement_id: { $in: activeAgreementIds } });
      await db.Dispute.deleteMany({ agreement_id: { $in: activeAgreementIds } });
      await db.Agreement.deleteMany({ id: { $in: activeAgreementIds } });
    }

    // 2. Unlock the counterparties' items and notify them (one each)
    for (const a of activeAgreements) {
      const isDeletedUserOfferer = a.offerer_id === userId;
      if (!isDeletedUserOfferer && a.item_id) {
        try {
          const item = await db.Item.get(a.item_id);
          if (item && item.offerer_id !== userId) {
            await db.Item.update(a.item_id, { status: 'active', is_reserved: false, reserved_for_agreement_id: '' });
          }
        } catch (e) {
          // item may already be gone; nothing to unlock
        }
      }
    }
    for (const c of counterparties) {
      await db.Notification.create(await prepareNotification(db, {
        user_id: c.id,
        type: 'moderation_resolved',
        title: 'Agreement cancelled',
        message: 'The other member in your agreement' +
          (c.item_titles.length > 1 ? 's' : '') +
          ' (' + c.item_titles.join(', ') + ') was removed from the community. ' +
          'The agreement was cancelled and your item is available for new offers again.',
        related_id: c.agreement_ids[0] || '',
        related_type: 'agreement',
        link_url: '/browse',
      }));
    }

    // 3. Anonymize kept (completed/cancelled) agreements
    if (keptAgreements.length > 0) {
      await db.Agreement.updateMany({ offerer_id: userId }, { $set: { offerer_name: 'Deleted user' } });
      await db.Agreement.updateMany({ worker_id: userId }, { $set: { worker_name: 'Deleted user' } });
    }

    // 4. Close and anonymize their negotiations
    await db.Negotiation.updateMany({ offerer_id: userId }, { $set: { offerer_name: 'Deleted user', status: 'closed' } });
    await db.Negotiation.updateMany({ bidder_id: userId }, { $set: { bidder_name: 'Deleted user', status: 'closed' } });

    // 5. Waitlist entries (their own + entries on their items)
    await db.ItemWaitlist.deleteMany({ user_id: userId });
    if (itemIds.length > 0) {
      await db.ItemWaitlist.deleteMany({ item_id: { $in: itemIds } });
      await db.Message.deleteMany({ item_id: { $in: itemIds } });
    }

    // 6. Messages involving the user
    await db.Message.deleteMany({ from_user_id: userId });
    await db.Message.deleteMany({ to_user_id: userId });

    // 7. Reviews in both directions + recompute affected users' ratings
    const affectedRaters = new Set();
    for (const r of ratingsGiven) if (r.to_user_id && r.to_user_id !== userId) affectedRaters.add(r.to_user_id);
    for (const r of ratingsReceived) if (r.from_user_id && r.from_user_id !== userId) affectedRaters.add(r.from_user_id);
    await db.Rating.deleteMany({ from_user_id: userId });
    await db.Rating.deleteMany({ to_user_id: userId });
    for (const affectedId of affectedRaters) {
      const remaining = await db.Rating.filter({ to_user_id: affectedId, published: true });
      const avg = remaining.length > 0 ? remaining.reduce((s, r) => s + r.stars, 0) / remaining.length : 0;
      const rounded = Math.round(avg * 10) / 10;
      try {
        await db.User.update(affectedId, { rating: rounded, total_ratings: remaining.length });
      } catch (e) {
        // user record may not be updatable; worker profile below is the public-facing one
      }
      const affectedWorkers = await db.Worker.filter({ user_id: affectedId });
      if (affectedWorkers[0]) {
        await db.Worker.update(affectedWorkers[0].id, { rating: rounded, total_ratings: remaining.length });
      }
      try {
        await db.Item.updateMany({ offerer_id: affectedId }, { $set: { offerer_rating: rounded, offerer_total_ratings: remaining.length } });
      } catch (e) {
        // affected member may have no listings
      }
    }

    // 8. Remaining own records
    await db.KarmaTransaction.deleteMany({ user_id: userId });
    await db.BlockedUser.deleteMany({ blocker_id: userId });
    await db.BlockedUser.deleteMany({ blocked_id: userId });
    await db.TermsAcceptance.deleteMany({ user_id: userId });
    await db.Report.deleteMany({ reporter_id: userId });
    await db.Dispute.deleteMany({ opened_by: userId });
    await db.Notification.deleteMany({ user_id: userId });

    // 9. Listings, then worker profile
    await db.Item.deleteMany({ offerer_id: userId });
    if (workerProfile[0]) await db.Worker.delete(workerProfile[0].id);

    // 10. Tombstone (no personal data)
    await db.DeletedUser.create({
      user_id: userId,
      deleted_by: admin.id,
      deleted_by_name: admin.full_name,
      deleted_date: new Date().toISOString(),
      reason: reason,
    });

    return Response.json({
      mode: 'execute',
      user_id: userId,
      success: true,
      deleted: preview.will_delete,
      counterparties_notified: counterparties.length,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}