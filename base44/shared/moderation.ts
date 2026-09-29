// Shared moderation gate for backend functions.
// Suspended or banned members are rejected server-side so admin moderation
// actions are enforced no matter what the client does. Admins are never
// blocked by these flags (their accounts cannot be moderated anyway).
export async function getActiveUser(base44) {
  const user = await base44.auth.me();
  if (!user) return { user: null, status: 401, error: 'Unauthorized' };
  if (user.role !== 'admin' && (user.is_banned || user.is_suspended)) {
    return {
      user: null,
      status: 403,
      error: 'Your account is suspended and cannot use Swap4Work right now.'
    };
  }
  return { user };
}