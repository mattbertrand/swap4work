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

// Loads an agreement and verifies it is trustworthy: not self-dealt (the same
// user on both sides) and tied to a real listing owned by the offerer. Since
// Agreement records can be created from the client, completion/review logic
// must never trust one that fails these checks.
export async function loadVerifiedAgreement(db, agreementId) {
  let agreement = null;
  try {
    const agreements = await db.Agreement.filter({ id: agreementId });
    agreement = agreements[0];
  } catch (e) {
    agreement = null;
  }
  if (!agreement) return { agreement: null, status: 404, error: 'Agreement not found' };
  if (agreement.offerer_id === agreement.worker_id) {
    return { agreement: null, status: 400, error: 'Invalid agreement' };
  }
  let item = null;
  try {
    const items = await db.Item.filter({ id: agreement.item_id });
    item = items[0];
  } catch (e) {
    item = null;
  }
  if (!item || item.offerer_id !== agreement.offerer_id) {
    return { agreement: null, status: 400, error: 'Invalid agreement' };
  }
  return { agreement };
}