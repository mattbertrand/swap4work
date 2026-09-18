import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const admin = await base44.auth.me();
    if (!admin) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (admin.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const userId = body.user_id;
    const action = body.action; // 'suspend' | 'ban' | 'unsuspend'
    const reason = body.reason || '';
    if (!userId || !['suspend', 'ban', 'unsuspend'].includes(action)) {
      return Response.json({ error: 'user_id and a valid action (suspend, ban, unsuspend) are required' }, { status: 400 });
    }
    if (userId === admin.id) return Response.json({ error: 'You cannot moderate your own account' }, { status: 400 });

    const db = base44.asServiceRole.entities;

    let target = null;
    try {
      const targetUsers = await db.User.filter({ id: userId });
      target = targetUsers[0];
    } catch (e) {
      target = null;
    }
    if (!target) return Response.json({ error: 'User not found' }, { status: 404 });
    if (target.role === 'admin') return Response.json({ error: 'Admin accounts cannot be moderated here' }, { status: 400 });

    const workers = await db.Worker.filter({ user_id: userId });
    const worker = workers[0];

    const suspending = action === 'suspend' || action === 'ban';

    // 1. User flags
    const userUpdate = suspending
      ? (action === 'ban' ? { is_suspended: true, is_banned: true } : { is_suspended: true })
      : { is_suspended: false, is_banned: false };
    await db.User.update(userId, userUpdate);

    // 2. Hide (or restore) their listings
    await db.Item.updateMany({ offerer_id: userId }, { $set: { is_hidden: suspending } });

    // 3. Hide (or restore) their worker profile
    if (worker) {
      await db.Worker.update(worker.id, { is_visible: !suspending });
    }

    // 4. Moderation log
    const reportsAboutUser = await db.Report.filter({ reported_user_id: userId });
    await db.ModerationHistory.create({
      report_id: 'manual_' + Date.now(),
      admin_id: admin.id,
      admin_name: admin.full_name,
      action: action === 'unsuspend' ? 'unsuspended' : action,
      target_user_id: userId,
      target_user_name: target.full_name,
      notes: reason,
      previous_report_count: reportsAboutUser.length,
    });

    return Response.json({
      success: true,
      action: action,
      user_id: userId,
      hidden_items: true,
      worker_profile_updated: !!worker,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}