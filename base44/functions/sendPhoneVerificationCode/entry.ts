import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

const isValidPhone = (phone) => {
  const cleaned = String(phone || '').replace(/[\s\-().]/g, "");
  return /^\+?[1-9]\d{6,14}$/.test(cleaned);
};

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const phone = String(body.phone || '').trim();
    if (!isValidPhone(phone)) {
      return Response.json({ error: 'Invalid phone number' }, { status: 400 });
    }

    // Rate limit: max 5 codes per user per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const recent = await base44.asServiceRole.entities.PhoneVerificationCode.filter({
      user_id: user.id,
      created_date: { $gte: oneHourAgo }
    });
    if (recent.length >= 5) {
      return Response.json({ error: 'Too many codes requested. Please try again later.' }, { status: 429 });
    }

    // Cryptographically secure 6-digit code with rejection sampling so the
    // distribution is exactly uniform (no modulo bias)
    const buf = new Uint32Array(1);
    let raw = 0;
    do {
      crypto.getRandomValues(buf);
      raw = buf[0];
    } while (raw >= 4294800000); // largest multiple of 900000 below 2^32
    const code = (100000 + (raw % 900000)).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    await base44.asServiceRole.entities.PhoneVerificationCode.create({
      user_id: user.id,
      phone,
      code,
      expires_at: expiresAt,
      used: false
    });

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: user.email,
      subject: "Your Swap4Work Phone Verification Code",
      body: `Your phone verification code is: ${code}\n\nEnter this code to verify your phone number (${phone}).\n\nThis code expires in 10 minutes.`
    });

    return Response.json({ sent: true, expires_at: expiresAt });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}