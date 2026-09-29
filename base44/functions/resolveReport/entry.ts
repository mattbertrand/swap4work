import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { getActiveUser } from '../../shared/moderation.ts';

// Admin-only report moderation. The Report resolution record, moderation
// history, warning/notification to the reported user, listing hiding, and
// suspension/ban all happen server-side with the service role. The Report
// entity's update rule is admin-only, so a reporter can never resolve or
// close their own report from the client.

const ACTIONS = ['ignored', 'warned', 'listing_hidden', 'suspended', 'banned'];

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const { user, status, error } = await getActiveUser(base44);
    if (!user) return Response.json({ error }, { status });
    if (user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const reportId = String(body.report_id || '');
    const action = String(body.action || '');
    if (!reportId) {
      return Response.json({ error: 'report_id is required' }, { status: 400 });
    }
    if (!ACTIONS.includes(action)) {
      return Response.json({ error: 'Invalid action' }, { status: 400 });
    }

    const db = base44.asServiceRole.entities;
    let report = null;
    try {
      const reports = await db.Report.filter({ id: reportId });
      report = reports[0];
    } catch (e) {
      report = null;
    }
    if (!report) return Response.json({ error: 'Report not found' }, { status: 404 });
    if (report.status === 'resolved' || report.status === 'ignored') {
      return Response.json({ error: 'Report is already resolved' }, { status: 400 });
    }

    const resolutionText = {
      ignored: 'Report ignored - no action needed',
      warned: 'User warned about their behavior',
      listing_hidden: 'Listing hidden from public view',
      suspended: 'User account suspended for 7 days',
      banned: 'User account permanently banned'
    }[action];

    // Previous report count for the same reported user, computed server-side
    let previousCount = 0;
    if (report.reported_user_id) {
      const userReports = await db.Report.filter({ reported_user_id: report.reported_user_id });
      previousCount = userReports.filter(
        (r) => r.id !== report.id && new Date(r.created_date) < new Date(report.created_date)
      ).length;
    }

    const now = new Date().toISOString();

    // 1. Update the report
    await db.Report.update(report.id, {
      status: action === 'ignored' ? 'ignored' : 'resolved',
      resolution: resolutionText,
      resolved_by: user.id,
      resolved_by_name: user.full_name,
      resolved_date: now
    });

    // 2. Moderation history entry
    await db.ModerationHistory.create({
      report_id: report.id,
      admin_id: user.id,
      admin_name: user.full_name,
      action,
      target_user_id: report.reported_user_id || '',
      target_user_name: report.reported_user_name || '',
      notes: resolutionText,
      previous_report_count: previousCount
    });

    // 3. Perform the actual moderation action
    if (action === 'warned' && report.reported_user_id) {
      await db.Notification.create({
        user_id: report.reported_user_id,
        type: 'moderation_warning',
        title: 'Warning from Swap4Work',
        message: `You have received a warning regarding: ${resolutionText}. Please review our community guidelines. Repeated violations may result in account suspension.`,
        from_user_id: user.id,
        from_user_name: user.full_name
      });
    }

    if (action === 'listing_hidden' && report.target_type === 'item') {
      await db.Item.update(report.target_id, { status: 'cancelled' });
    }

    if (action === 'suspended' && report.reported_user_id) {
      const suspendEndDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      await db.User.update(report.reported_user_id, {
        is_suspended: true,
        suspension_end_date: suspendEndDate.split('T')[0]
      });
    }

    if (action === 'banned' && report.reported_user_id) {
      await db.User.update(report.reported_user_id, {
        is_banned: true,
        is_suspended: true
      });
    }

    // 4. Notify the reporter that moderation is complete
    if (report.reporter_id) {
      await db.Notification.create({
        user_id: report.reporter_id,
        type: 'moderation_resolved',
        title: 'Your report has been reviewed',
        message: `Thank you for your report. Our team has reviewed it and taken action: ${resolutionText}.`,
        related_id: report.id,
        related_type: 'message',
        from_user_id: user.id,
        from_user_name: user.full_name
      });
    }

    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}