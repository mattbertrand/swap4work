import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// Public karma score for a member's profile. The KarmaTransaction ledger is
// admin-only; profiles read this aggregate instead of the rows.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const userId = String(body.user_id || '').trim();
    if (!userId) {
      return Response.json({ error: 'user_id is required' }, { status: 400 });
    }
    const users = await base44.asServiceRole.entities.User.filter({ id: userId });
    return Response.json({ karma_points: Number(users[0]?.karma_points) || 0 });
  } catch (error) {
    return Response.json({ karma_points: 0 });
  }
}