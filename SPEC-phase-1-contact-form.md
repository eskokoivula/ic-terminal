# SPEC — Phase 1: Contact CTA form + endpoint

*2026-05-27 · IC_Terminal*

## Goal

Replace the current `mailto:` CTA on the IC_Terminal landing page with an inline email-only form. Submissions deliver to `contact@ic-terminal.com` via a serverless endpoint. This is Phase 1 of three; mobile optimization (Phase 2) and deploy + custom domain (Phase 3) are separate.

## Domain correction

Existing code references `icterminal.com`. The registered domain is **`ic-terminal.com`** (with hyphen, GoDaddy). All references update as part of this work.

## Decisions locked

| Area | Pick |
|---|---|
| Email API | **Resend** — 3 000 sends/mo free, cleanest API, Vercel-native |
| Hosting | **Vercel** — same platform for static site and `/api/contact` function |
| Mailbox | **Zoho Mail Free** — free, sufficient for one inbox |
| Form fields | **`email`** (required, visible) + honeypot (hidden) |
| Ack headline | `Request received.` |
| Ack sub | `A (human) agent will get back to you shortly.` — `(human)` renders as serif italic blue `<em>` |

## Build sequence

The order matters: email infrastructure first, then code, then deploy.

### Step 0 — Email infrastructure (user-driven, guided)

a. Sign up for Zoho Mail Free, add `ic-terminal.com` as the domain
b. Verify domain ownership in Zoho (TXT record at GoDaddy)
c. Add Zoho's MX records at GoDaddy (3 records)
d. Create mailbox `contact@ic-terminal.com`
e. Send a test email from elsewhere → confirm it lands in Zoho

### Step 1 — Resend setup

a. Sign up for Resend
b. Add `ic-terminal.com` as a sending domain
c. Add Resend's DKIM + SPF records at GoDaddy (DNS propagation: 10 min – 2 h)
d. Verify the domain in Resend
e. Generate an API key → store in Vercel env as `RESEND_API_KEY`

### Step 2 — HTML: replace mailto CTA with form

In `index.html`, replace the contents of `<div class="cta__action reveal-item">` (around lines 669–673):

```html
<form id="cta-form" class="cta__action cta__form" novalidate>
  <input
    type="email"
    id="cta-email"
    name="email"
    class="cta__field"
    placeholder="your work email"
    autocomplete="email"
    required
  />
  <input
    type="text"
    name="website"
    class="cta__honeypot"
    tabindex="-1"
    autocomplete="off"
    aria-hidden="true"
  />
  <button type="submit" class="cta__btn">
    <span class="cta__btn-text">Request a diligence review</span>
    <span class="cta__btn-arrow" aria-hidden="true">↗</span>
  </button>
  <p class="cta__error" id="cta-error" hidden></p>
</form>
```

Honeypot is hidden via CSS (off-screen positioning), **not** the `hidden` attribute — bots often skip `[hidden]` and `display:none` fields.

### Step 3 — CSS: form + honeypot + inline error

Add to `styles.css`:

- `.cta__field` — underlined input matching the page's mono register; transparent background, no border-radius, no SaaS pill styling. Focus state: blue underline accent. Placeholder: muted.
- `.cta__honeypot` — absolutely positioned off-screen (e.g. `left: -9999px`), zero size, tab-index −1.
- `.cta__error` — small mono caption under the field; muted red, no border. Visible only when populated.
- Existing `.cta__btn` styling stays untouched.

### Step 4 — HTML + CSS: ack overlay

Add markup just before `</body>` in `index.html`:

```html
<div class="ack" id="ack" hidden aria-hidden="true" role="dialog" aria-labelledby="ack-line">
  <div class="ack__veil"></div>
  <div class="ack__card">
    <button type="button" class="ack__close" aria-label="Close">✕</button>
    <p class="ack__line" id="ack-line">Request received.</p>
    <p class="ack__sub">A <em>(human)</em> agent will get back to you shortly.</p>
  </div>
</div>
```

CSS under a new `/* ACK overlay */` block:

- `.ack` — fixed full-viewport, hidden by default
- `.ack__veil` — semi-transparent black backdrop
- `.ack__card` — centered, restrained card; no neon
- `.ack__line` — headline weight, sans
- `.ack__sub` — muted; `em` inside renders in serif italic, color `var(--blue)`
- `.ack__close` — top-right ✕, minimal hit target
- `.is-open` modifier toggles visibility + fade-in

### Step 5 — JS: form handler + ack open/close

Add a new IIFE-style block near the bottom of `app.js`, after existing init blocks:

```js
/* CTA request form → ACK overlay */
(() => {
  const form = document.getElementById('cta-form');
  if (!form) return;

  const emailInput = form.querySelector('#cta-email');
  const honeypot = form.querySelector('[name="website"]');
  const submitBtn = form.querySelector('.cta__btn');
  const errorEl = form.querySelector('#cta-error');

  const ack = document.getElementById('ack');
  const ackVeil = ack.querySelector('.ack__veil');
  const ackClose = ack.querySelector('.ack__close');
  let lastFocus = null;

  function openAck() {
    lastFocus = document.activeElement;
    ack.hidden = false;
    ack.setAttribute('aria-hidden', 'false');
    ack.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    ackClose.focus();
  }

  function closeAck() {
    ack.classList.remove('is-open');
    ack.setAttribute('aria-hidden', 'true');
    ack.hidden = true;
    document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  }

  function showError(msg) {
    errorEl.textContent = msg;
    errorEl.hidden = false;
  }

  function clearError() {
    errorEl.hidden = true;
    errorEl.textContent = '';
  }

  ackClose.addEventListener('click', closeAck);
  ackVeil.addEventListener('click', closeAck);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && ack.classList.contains('is-open')) closeAck();
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearError();

    if (!form.checkValidity()) {
      emailInput.reportValidity();
      return;
    }

    submitBtn.disabled = true;

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailInput.value.trim(),
          website: honeypot.value,
        }),
      });

      if (!res.ok) throw new Error('bad response');

      openAck();
      form.reset();
    } catch (err) {
      showError('Could not send. Please try again or email contact@ic-terminal.com directly.');
    } finally {
      submitBtn.disabled = false;
    }
  });
})();
```

### Step 6 — Serverless endpoint

New file: `api/contact.js` (Vercel convention — file auto-routes to `/api/contact`).

```js
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

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
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, website } = req.body || {};

  // honeypot: silent success so bots don't retry
  if (website && website.length > 0) return res.status(200).json({ ok: true });

  if (!isValidEmail(email)) return res.status(400).json({ error: 'Invalid email' });

  const ip = req.headers['x-forwarded-for']?.split(',')[0].trim()
    || req.headers['x-real-ip']
    || 'unknown';

  if (!rateLimit(ip)) return res.status(429).json({ error: 'Too many requests' });

  try {
    await resend.emails.send({
      from: 'IC_Terminal <noreply@ic-terminal.com>',
      to: 'contact@ic-terminal.com',
      reply_to: email,
      subject: 'New diligence review request',
      text: `New request from: ${email}\n\nSubmitted at: ${new Date().toISOString()}\nIP: ${ip}`,
    });
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Resend error:', err);
    return res.status(500).json({ error: 'Send failed' });
  }
}
```

A small `package.json` is added with the `resend` dependency. No build step beyond Vercel's automatic function bundling.

### Step 7 — Update mailto links

Two locations update; both stay as escape hatches in case the form errors:

- `index.html` line 52 (nav): `mailto:demo@icterminal.com` → `mailto:contact@ic-terminal.com`
- `index.html` line 688 (footer): `mailto:demo@icterminal.com` → `mailto:contact@ic-terminal.com`

The CTA mailto on line 670 is replaced by the form in Step 2 — nothing to update there.

### Step 8 — Vercel project setup

a. Push code to a GitHub repo (if not already)
b. Connect the repo to a new Vercel project
c. Add env: `RESEND_API_KEY`
d. First deploy → use the auto-assigned `*.vercel.app` URL for testing
e. Submit a real form → verify the email lands in Zoho

Custom domain `ic-terminal.com` is wired in **Phase 3**, not here. Phase 1 ends with a working form on the vercel.app URL.

## Out of scope (defer)

- Mobile optimization (Phase 2)
- Custom domain on the site itself (Phase 3)
- Additional form fields beyond email
- Confirmation email back to the submitter
- Captcha / Cloudflare Turnstile
- Submit-event analytics

## Risks

- **Resend free tier:** 3 000/mo, 100/day. Sufficient now; if a campaign drives traffic, review.
- **DNS propagation:** Zoho + Resend verification can take hours. Budget for it.
- **Honeypot only:** Catches naive bots. If real spam volume appears, add Cloudflare Turnstile (invisible, no friction).
- **In-memory rate limit resets on cold start:** Acceptable at this volume. Upgrade to Vercel KV if stricter limits are needed (~5 min change).

## Verification (manual smoke test before "done")

The project has no automated tests, so verification is by hand:

1. Submit form with a valid email → ack overlay opens → email lands in Zoho inbox
2. Submit with invalid email → HTML5 validation blocks; ack does not open
3. In DevTools, fill the honeypot → submit → ack does NOT open (silent 200); no email arrives
4. Spam 4 submissions in under 10 minutes from one IP → 4th returns 429 → inline error shows; ack stays closed
5. Disable network → submit → inline error shows; ack stays closed
6. Click nav and footer mailto links → mail client opens with `contact@ic-terminal.com`
7. ESC, veil click, and ✕ button all close the ack → focus returns to the form
