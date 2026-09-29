// Shared moderation gate and helpers for backend functions.

// Enforced moderation state lives in a server-only ModerationStatus record
// (only backend functions can write it, mirroring HandoverConfirmation and
// PhoneVerification), because the is_banned/is_suspended fields on the User
// record are client-writable via updateMe and would let a suspended member
// lift their own flags. The User fields are still mirrored for UI display,
// but enforcement only reads the ledger. Admins are never blocked by these
// flags (their accounts cannot be moderated anyway).
export async function getActiveUser(base44) {
  const user = await base44.auth.me();
  if (!user) return { user: null, status: 401, error: 'Unauthorized' };
  if (user.role !== 'admin') {
    let record = null;
    try {
      const records = await base44.asServiceRole.entities.ModerationStatus.filter({ user_id: user.id });
      record = records[0];
    } catch (e) {
      record = null;
    }
    if (record && (record.is_banned || record.is_suspended)) {
      return {
        user: null,
        status: 403,
        error: 'Your account is suspended and cannot use Swap4Work right now.'
      };
    }
  }
  return { user };
}

// Creates or updates the moderation ledger record for a user. Callers still
// mirror flags onto the User record for UI display; only this ledger is
// consulted for enforcement. Partial flags merge with the existing record,
// matching the semantics of a partial User.update.
export async function applyModerationFlags(db, userId, flags) {
  let record = null;
  try {
    const records = await db.ModerationStatus.filter({ user_id: userId });
    record = records[0];
  } catch (e) {
    record = null;
  }
  if (record) {
    await db.ModerationStatus.update(record.id, flags);
  } else {
    await db.ModerationStatus.create({ user_id: userId, is_banned: false, is_suspended: false, ...flags });
  }
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