import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { getActiveUser } from '../../shared/moderation.ts';
import { publicArea, isCheckCurrent } from '../../shared/locationAreas.ts';

// Owner-only details for the profile location card. Returns the CALLER's own
// check only — never another member's, and never to an anonymous visitor.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const { user, status, error } = await getActiveUser(base44);
    if (!user) return Response.json({ error }, { status });

    const db = base44.asServiceRole.entities;
    const area = publicArea(user.location);
    const checks = await db.LocationCheck.filter({ user_id: user.id }, '-created_date', 1);
    const check = checks[0] || null;

    return Response.json({
      primary_area: area,
      current: isCheckCurrent(check, area),
      checked_area: check?.checked_area || null,
      checked_date: check?.checked_date || null,
      expires_at: check?.expires_at || null
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}