import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// in-memory rate limit (resets on cold start, fine for low volume)
const rateLimitMap = new Map();
const LIMIT = 3;
const WINDOW_MS = 10 * 60 * 1000;

function rateLimit(ip) {
  const now = Date.now();
  const entries = (rateLimitMap.get(ip) || []).filter(t => now - t < WINDOW_MS);
  entries.push(now);
  rateLimitMap.set(ip, entries);
  return entries.length <= LIMIT;
}

function isValidEmail(s) {
  return typeof s === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, website } = req.body || {};

  // honeypot: silent success so bots don't retry
  if (website && website.length > 0) {
    return res.status(200).json({ ok: true });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Invalid email' });
  }

  const ip = req.headers['x-forwarded-for']?.split(',')[0].trim()
    || req.headers['x-real-ip']
    || 'unknown';

  if (!rateLimit(ip)) {
    return res.status(429).json({ error: 'Too many requests' });
  }

  // 1) admin notification — required; failure here surfaces to the user
  try {
    await resend.emails.send({
      from: 'IC_Terminal <noreply@ic-terminal.com>',
      to: 'contact@ic-terminal.com',
      reply_to: email,
      subject: 'New diligence review request',
      text: `New request from: ${email}\n\nSubmitted at: ${new Date().toISOString()}\nIP: ${ip}`,
    });
  } catch (err) {
    console.error('Resend error (admin):', err);
    return res.status(500).json({ error: 'Send failed' });
  }

  // 2) submitter confirmation — best effort; failure logs but does not fail the request
  // HTML body prevents Gmail/Outlook from collapsing "— IC_Terminal" as a signature
  try {
    await resend.emails.send({
      from: 'IC_Terminal <noreply@ic-terminal.com>',
      to: email,
      subject: 'Request received',
      html: `<p>Hi,</p><p>We've received your submission.</p><p>One of our human agents will follow up shortly with next steps.</p><p>Best regards,<br>IC Terminal team</p>`,
      text: `Hi,\n\nWe've received your submission.\n\nOne of our human agents will follow up shortly with next steps.\n\nBest regards,\nIC Terminal team`,
    });
  } catch (err) {
    console.error('Resend error (confirmation):', err);
    // continue — admin was already notified
  }

  return res.status(200).json({ ok: true });
}
