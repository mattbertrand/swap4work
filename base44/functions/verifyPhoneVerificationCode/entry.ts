import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { normalizePhoneE164 } from '../../shared/phone.ts';
import { getActiveUser } from '../../shared/moderation.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const { user, status, error } = await getActiveUser(base44);
    if (!user) return Response.json({ error }, { status });

    const body = await req.json();
    const phone = normalizePhoneE164(String(body.phone || ''));
    const code = String(body.code || '').replace(/\D/g, '');
    if (!phone || code.length !== 6) {
      return Response.json({ error: 'Invalid request' }, { status: 400 });
    }

    const codes = await base44.asServiceRole.entities.PhoneVerificationCode.filter({
      user_id: user.id,
      phone,
      used: false
    }, '-created_date', 10);

    const now = new Date();
    const active = codes.filter(c => new Date(c.expires_at) > now)
      .sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    const latest = active[0];

    if (!latest) {
      return Response.json({ confirmed: false, error: 'Incorrect or expired code' }, { status: 400 });
    }

    // Brute-force protection: invalidate the code after 5 failed attempts
    if (latest.code !== code) {
      const failedAttempts = (latest.failed_attempts || 0) + 1;
      await base44.asServiceRole.entities.PhoneVerificationCode.update(latest.id, {
        failed_attempts: failedAttempts,
        ...(failedAttempts >= 5 ? { used: true } : {})
      });
      return Response.json({ confirmed: false, error: 'Incorrect or expired code' }, { status: 400 });
    }

    await base44.asServiceRole.entities.PhoneVerificationCode.update(latest.id, { used: true });

    // Record the confirmation server-side — the client never writes a
    // "verified" flag, so the status can't be forged through profile updates.
    const db = base44.asServiceRole.entities;
    const verifiedNow = new Date().toISOString();
    const existing = await db.PhoneVerification.filter({ user_id: user.id, phone }, '-created_date', 20);
    if (existing[0]) {
      await db.PhoneVerification.update(existing[0].id, { verified_date: verifiedNow });
    } else {
      await db.PhoneVerification.create({ user_id: user.id, phone, verified_date: verifiedNow });
    }
    return Response.json({ confirmed: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}