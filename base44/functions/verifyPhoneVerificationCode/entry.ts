import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const phone = String(body.phone || '').trim();
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
      return Response.json({ verified: false, error: 'Incorrect or expired code' }, { status: 400 });
    }

    // Brute-force protection: invalidate the code after 5 failed attempts
    if (latest.code !== code) {
      const failedAttempts = (latest.failed_attempts || 0) + 1;
      await base44.asServiceRole.entities.PhoneVerificationCode.update(latest.id, {
        failed_attempts: failedAttempts,
        ...(failedAttempts >= 5 ? { used: true } : {})
      });
      return Response.json({ verified: false, error: 'Incorrect or expired code' }, { status: 400 });
    }

    await base44.asServiceRole.entities.PhoneVerificationCode.update(latest.id, { used: true });
    return Response.json({ verified: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}