import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { publicArea, isCheckCurrent } from '../../shared/locationAreas.ts';

// Public yes/no indicator: does this member currently have a valid location
// check? Returns exactly { checked: boolean } — never the record, the checked
// area, any dates, the user id or any other LocationCheck field.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const userId = String(body.user_id || '').trim();
    if (!userId) {
      return Response.json({ error: 'user_id is required' }, { status: 400 });
    }

    const db = base44.asServiceRole.entities;

    // The claimed area comes from the member's saved profile, never the request
    const users = await db.User.filter({ id: userId });
    const area = publicArea(users[0]?.location);
    if (!area) return Response.json({ checked: false });

    const checks = await db.LocationCheck.filter({ user_id: userId }, '-created_date', 1);
    return Response.json({ checked: isCheckCurrent(checks[0], area) });
  } catch (error) {
    return Response.json({ checked: false });
  }
}