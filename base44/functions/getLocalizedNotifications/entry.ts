import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { notificationDisplay } from '../../shared/notificationLocalization.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(e => e.status === 401 ? null : Promise.reject(e));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    if (!['en','es'].includes(body.language) || typeof body.is_read !== 'boolean') return Response.json({ error: 'Invalid language or read status' }, { status: 400 });
    const page = await base44.entities.Notification.filter({ user_id: user.id, is_read: body.is_read }, { sort: '-created_date', limit: 30, ...(typeof body.cursor === 'string' ? { cursor: body.cursor } : {}) });
    return Response.json({ ...page, items: page.items.map(record => {
      const display = notificationDisplay(record, body.language);
      return { ...record, display_title: display.title, display_message: display.message, localized: !!display.metadata };
    }) });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}