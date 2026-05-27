# Phase 1 Contact Form — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the `mailto:` CTA with an inline email-only form that posts to a Resend-backed Vercel serverless endpoint, delivering to `contact@ic-terminal.com`. Includes an ack overlay, honeypot field, and rate limit.

**Architecture:** Static site (no framework) gains one new `api/contact.js` Vercel function. Form posts JSON `{ email, website }` to `/api/contact`; function validates email, silent-drops honeypot hits, rate-limits per IP, sends via Resend. Success opens an ack overlay; failure shows inline error.

**Tech Stack:** Vanilla HTML/CSS/JS, Resend Node SDK, Vercel serverless (Node 20 runtime), Zoho Mail inbox at `contact@ic-terminal.com`.

**Spec:** [SPEC-phase-1-contact-form.md](./SPEC-phase-1-contact-form.md)

---

## Phase 0 — External services (user-driven, no code)

### Task 0: Resend account + API key

**Done outside the codebase. Required before Task 2.**

- [ ] Step 1: Sign up at <https://resend.com> with the GoDaddy email or a personal email
- [ ] Step 2: In Resend → **Domains** → **Add Domain** → enter `ic-terminal.com`
- [ ] Step 3: Resend shows DNS records (1× TXT for SPF, 3× CNAME for DKIM). Open GoDaddy → DNS panel → add each one exactly as shown
- [ ] Step 4: Wait for DNS to propagate (10 min – 2 h). Refresh Resend domain page → click **Verify** until all rows turn green
- [ ] Step 5: In Resend → **API Keys** → **Create API Key**. Name: `ic-terminal-vercel`. Permissions: **Sending access** only. Copy the key (starts with `re_`) somewhere safe — you cannot see it again.
- [ ] Step 6: **Sanity check** — In Resend dashboard, use the "Send test email" UI to send from `noreply@ic-terminal.com` to your personal Gmail. Confirm it arrives within 1 minute. If it lands in spam, DKIM is not verified yet — wait longer or recheck records.

---

## Phase A — Codebase setup

### Task 1: Initialize git + .gitignore

**Files:**
- Create: `.gitignore`

- [ ] Step 1: Initialize repo

```bash
cd "/Users/macesko/Desktop/Claude general/Projects/ic_terminal"
git init
```

- [ ] Step 2: Write `.gitignore`

```
node_modules/
.env
.env.local
.vercel/
.DS_Store
HANDOFF.md
IC_Terminal.html
IC_Terminal.zip
.thumbnail
```

(The big `IC_Terminal.html`/`.zip` files at the project root are old exports; they bloat any repo and should not be tracked.)

- [ ] Step 3: Initial commit

```bash
git add .gitignore CLAUDE.md SPEC-phase-1-contact-form.md PLAN-phase-1-contact-form.md IC_TERMINAL_FIXES.md
git commit -m "chore: init repo with gitignore and existing planning docs"
```

- [ ] Step 4: Add existing source files separately so they're their own commit

```bash
git add index.html styles.css app.js tweaks.jsx tweaks-panel.jsx assets/
git commit -m "chore: import existing source files"
```

- [ ] **Sanity check:** Run `git status` — output should be `nothing to commit, working tree clean`. Run `git log --oneline` — should show 2 commits.

---

### Task 2: Add package.json with Resend

**Files:**
- Create: `package.json`

- [ ] Step 1: Write `package.json`

```json
{
  "name": "ic-terminal",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "dependencies": {
    "resend": "^4.0.0"
  }
}
```

- [ ] Step 2: Install

```bash
npm install
```

- [ ] Step 3: Commit

```bash
git add package.json package-lock.json
git commit -m "chore: add resend dependency"
```

- [ ] **Sanity check:** `ls node_modules/resend/package.json` — file exists. `npm ls resend` — prints `resend@4.x.x` with no errors.

---

### Task 3: Create serverless endpoint

**Files:**
- Create: `api/contact.js`

- [ ] Step 1: Create directory

```bash
mkdir -p api
```

- [ ] Step 2: Write `api/contact.js`

```js
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

- [ ] Step 3: Commit

```bash
git add api/contact.js
git commit -m "feat: add /api/contact serverless endpoint"
```

- [ ] **Sanity check:** Visual review — file is ~55 lines, has `export default async function handler`, uses `process.env.RESEND_API_KEY`, calls `resend.emails.send` with `to: 'contact@ic-terminal.com'`. Endpoint is not runnable locally without `vercel dev`; real runtime test happens after Task 12 deploy.

---

### Task 4: Document required env var

**Files:**
- Create: `.env.example`

- [ ] Step 1: Write `.env.example`

```
# Resend API key from https://resend.com/api-keys
RESEND_API_KEY=re_your_key_here
```

- [ ] Step 2: Commit

```bash
git add .env.example
git commit -m "docs: document required env var"
```

---

## Phase B — Frontend changes

### Task 5: Replace mailto CTA with form

**Files:**
- Modify: `index.html` (lines 669–674)

- [ ] Step 1: In `index.html`, find this block (currently lines 669–674):

```html
    <div class="cta__action reveal-item" style="--i:5">
      <a href="mailto:demo@icterminal.com" class="cta__btn">
        <span class="cta__btn-text">Request a diligence review</span>
        <span class="cta__btn-arrow" aria-hidden="true">↗</span>
      </a>
    </div>
```

Replace with:

```html
    <form id="cta-form" class="cta__action cta__form reveal-item" style="--i:5" novalidate>
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

Class `reveal-item` and `style="--i:5"` are preserved so the existing scroll-reveal animation still triggers.

- [ ] Step 2: **Sanity check** — Run local server:

```bash
python3 -m http.server 8000
```

Open <http://localhost:8000>, scroll to the bottom CTA section. Confirm:
- Email field is visible above the "Request a diligence review" button
- Button text and arrow unchanged
- Form looks unstyled / awkwardly aligned — **this is expected**, CSS comes in Tasks 8–9

Stop the server with `Ctrl+C`.

- [ ] Step 3: Commit

```bash
git add index.html
git commit -m "feat: replace mailto CTA with email form"
```

---

### Task 6: Add ack overlay markup

**Files:**
- Modify: `index.html` (insert before line 696, `<script src="app.js…">`)

- [ ] Step 1: Find this line in `index.html`:

```html
<script src="app.js?v=nav3-3"></script>
```

Insert **immediately before** it (so script still loads last):

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

- [ ] Step 2: **Sanity check** — Run `python3 -m http.server 8000`, open the page. In DevTools console:

```js
document.getElementById('ack')
```

Should return the `<div class="ack" id="ack" hidden>…</div>` element. Stop server.

- [ ] Step 3: Commit

```bash
git add index.html
git commit -m "feat: add ack overlay markup"
```

---

### Task 7: Correct nav and footer mailto addresses

**Files:**
- Modify: `index.html` (line 52 and 688 — both contain identical `mailto:demo@icterminal.com`)

- [ ] Step 1: In `index.html`, use a find-and-replace-all for the string `mailto:demo@icterminal.com` → `mailto:contact@ic-terminal.com`. This affects exactly two remaining links (the CTA mailto was removed in Task 5).

If using the Edit tool, set `replace_all: true`.

If editing by hand: both lines look like

```html
<a href="mailto:demo@icterminal.com">Contact</a>
```

and become

```html
<a href="mailto:contact@ic-terminal.com">Contact</a>
```

- [ ] Step 2: **Sanity check** — Run `python3 -m http.server 8000`, open page. Click the "Contact" link in the top nav panel (toggle nav if needed). Mail client opens with `contact@ic-terminal.com` as recipient. Scroll to footer, click "Contact" there. Same behavior. Stop server.

- [ ] Step 3: Commit

```bash
git add index.html
git commit -m "fix: correct mailto address to contact@ic-terminal.com"
```

---

### Task 8: Add form CSS

**Files:**
- Modify: `styles.css` (append at end of file)

- [ ] Step 1: Append to `styles.css`:

```css

/* ───────── CTA form ───────── */

.cta__form {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 24px;
  width: 100%;
  max-width: 420px;
  margin: 0 auto;
}

.cta__field {
  display: block;
  width: 100%;
  box-sizing: border-box;
  background: transparent;
  border: 0;
  border-bottom: 1px solid var(--text-3);
  border-radius: 0;
  padding: 10px 0;
  font-family: var(--mono);
  font-size: 15px;
  letter-spacing: .02em;
  color: var(--text);
  text-align: center;
  outline: none;
  transition: border-color .25s var(--ease);
}

.cta__field::placeholder {
  color: var(--text-3);
  opacity: .7;
}

.cta__field:focus {
  border-bottom-color: var(--blue);
}

.cta__field:invalid:not(:placeholder-shown) {
  border-bottom-color: var(--red);
}

.cta__honeypot {
  position: absolute !important;
  left: -10000px !important;
  width: 1px;
  height: 1px;
  overflow: hidden;
  opacity: 0;
}

.cta__error {
  margin: 0;
  font-family: var(--mono);
  font-size: 12px;
  color: var(--red);
  letter-spacing: .04em;
  text-align: center;
}

/* preserve .cta__btn appearance now that it's a <button> instead of <a> */
button.cta__btn {
  background: transparent;
  border: 0;
  padding: 0;
  font: inherit;
  color: inherit;
  cursor: pointer;
  text-align: inherit;
}

button.cta__btn:disabled {
  opacity: .4;
  pointer-events: none;
}
```

- [ ] Step 2: **Sanity check** — `python3 -m http.server 8000`, refresh page. CTA section should now show:
- Centered email field with `--text-3` colored underline
- Placeholder "your work email" in muted text
- Focus on field → underline turns blue
- Type an invalid email like `foo` → underline turns red
- Button looks identical to before (text + arrow)
- Field stack and button vertically aligned with comfortable spacing

Stop server.

- [ ] Step 3: Commit

```bash
git add styles.css
git commit -m "feat: style cta form field, error, button"
```

---

### Task 9: Add ack overlay CSS

**Files:**
- Modify: `styles.css` (append after form CSS)

- [ ] Step 1: Append to `styles.css`:

```css

/* ───────── ACK overlay ───────── */

.ack {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: grid;
  place-items: center;
  opacity: 0;
  pointer-events: none;
  transition: opacity .35s var(--ease);
}

.ack[hidden] {
  display: none;
}

.ack.is-open {
  opacity: 1;
  pointer-events: auto;
}

.ack__veil {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, .72);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  cursor: pointer;
}

.ack__card {
  position: relative;
  z-index: 1;
  max-width: 520px;
  padding: 56px 64px 48px;
  background: #0a0c16;
  border: 1px solid var(--text-3);
  box-shadow: 0 40px 80px rgba(0, 0, 0, .6);
  text-align: center;
}

.ack__close {
  position: absolute;
  top: 14px;
  right: 18px;
  background: transparent;
  border: 0;
  color: var(--text-3);
  font-family: var(--mono);
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
  padding: 6px 8px;
  transition: color .2s var(--ease);
}

.ack__close:hover,
.ack__close:focus-visible {
  color: var(--text);
  outline: none;
}

.ack__line {
  margin: 0 0 14px;
  font-family: var(--mono);
  font-size: 22px;
  letter-spacing: -.01em;
  color: var(--text);
}

.ack__sub {
  margin: 0;
  font-family: var(--mono);
  font-size: 14px;
  color: var(--text-3);
  letter-spacing: .02em;
}

.ack__sub em {
  font-family: Georgia, 'Times New Roman', serif;
  font-style: italic;
  color: var(--blue);
  font-weight: 400;
}
```

- [ ] Step 2: **Sanity check** — `python3 -m http.server 8000`, refresh page. In DevTools console, manually open the ack to preview styling:

```js
const a = document.getElementById('ack');
a.hidden = false;
a.classList.add('is-open');
```

Should see:
- Dark veil dimming page
- Centered card with thin border
- "Request received." in mono
- Sub-line with `(human)` in serif italic blue
- ✕ in top-right corner
- Clicking veil does nothing yet (handler comes in Task 10)

Reset:
```js
a.classList.remove('is-open');
a.hidden = true;
```

Stop server.

- [ ] Step 3: Commit

```bash
git add styles.css
git commit -m "feat: style ack overlay"
```

---

### Task 10: Add form handler + ack open/close logic

**Files:**
- Modify: `app.js` (insert new block immediately before the final `})();` at end of file)

- [ ] Step 1: Find the end of `app.js`. The last lines are:

```js
    if ('ResizeObserver' in window) new ResizeObserver(schedule).observe(spine);
    document.fonts && document.fonts.ready && document.fonts.ready.then(alignLine);
  }
})();
```

Insert this block **immediately before** the closing `})();` (so the new code stays inside the existing IIFE — per the project convention "app.js is one IIFE"):

```js

  /* ──────────  CTA request form → ACK overlay  ────────── */
  {
    const form = document.getElementById('cta-form');
    if (form) {
      const emailInput = form.querySelector('#cta-email');
      const honeypot   = form.querySelector('[name="website"]');
      const submitBtn  = form.querySelector('.cta__btn');
      const errorEl    = form.querySelector('#cta-error');

      const ack       = document.getElementById('ack');
      const ackVeil   = ack.querySelector('.ack__veil');
      const ackClose  = ack.querySelector('.ack__close');
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
        if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
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
              website: honeypot.value, // honeypot — bots fill this; server silent-drops
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
    }
  }
```

- [ ] Step 2: **Sanity check (UI behavior only — endpoint still missing)** — Run `python3 -m http.server 8000`, refresh page.

1. Click email field → cursor enters; type `foo` → field underline turns red
2. Click submit → browser HTML5 validation tooltip appears ("Please include an @ in the email address")
3. Clear field, type `test@example.com` → underline returns to blue/grey
4. Open DevTools → Network tab. Click submit
5. Network tab shows a POST to `/api/contact` returning **404** (endpoint not deployed yet)
6. Inline error appears under field: "Could not send. Please try again or email contact@ic-terminal.com directly."
7. Ack overlay does **NOT** open (expected — POST failed)
8. Button re-enables after request settles

This confirms the handler works; the failing POST is expected at this stage.

- [ ] Step 3: Confirm ack overlay open/close manually:

```js
document.querySelector('.ack__close').click(); // no-op until ack is open
```

Force-open ack via console:
```js
const a = document.getElementById('ack');
a.hidden = false; a.setAttribute('aria-hidden','false'); a.classList.add('is-open');
```

Then test close affordances:
- Press `Escape` → ack closes
- Reopen via console, click on the dark veil area → ack closes
- Reopen, click ✕ → ack closes

Stop server.

- [ ] Step 4: Commit

```bash
git add app.js
git commit -m "feat: add cta form handler and ack open/close"
```

---

## Phase C — Deploy

### Task 11: Push to GitHub

**Files:** none directly; this creates the remote repo

- [ ] Step 1: Create a new private repo on GitHub (via web UI):
  - Name: `ic-terminal`
  - Private
  - No README, no .gitignore, no license — we have ours already

- [ ] Step 2: Add remote and push (replace `<USER>` with the GitHub username):

```bash
git remote add origin git@github.com:<USER>/ic-terminal.git
git branch -M main
git push -u origin main
```

- [ ] **Sanity check:** Open the repo URL in browser; all files visible; `node_modules/` and `.env*` correctly absent.

---

### Task 12: Set up Vercel project + env var

**Files:** none

- [ ] Step 1: Sign in at <https://vercel.com> (use GitHub auth)
- [ ] Step 2: **Add New → Project** → Import the `ic-terminal` GitHub repo
- [ ] Step 3: Framework Preset: leave as **Other** (Vercel detects static). Root directory: `./`. Build command: leave empty. Output directory: leave empty. Install command: `npm install`.
- [ ] Step 4: Before clicking Deploy, expand **Environment Variables**. Add:
  - Name: `RESEND_API_KEY`
  - Value: `re_…` (the key from Task 0 Step 5)
  - Environments: check all three (Production, Preview, Development)
- [ ] Step 5: Click **Deploy**
- [ ] Step 6: Wait ~1 min. Vercel shows a deployment URL like `ic-terminal-xxxxxx.vercel.app`.

- [ ] **Sanity check:** Open the `*.vercel.app` URL. Page loads identically to local. View page source — confirm `<form id="cta-form">` and `<div class="ack" id="ack">` are present.

---

### Task 13: End-to-end smoke test on deployed URL

**Files:** none — runtime verification

Run all 7 checks from the SPEC verification section against the deployed URL:

- [ ] **Check 1 — Happy path:** On the deployed page, fill email with a real address you control (e.g. your Gmail). Submit. Ack overlay opens with "Request received." + serif italic blue `(human)` sub. Within 1 minute, an email arrives at `contact@ic-terminal.com` (your Zoho inbox).

- [ ] **Check 2 — Invalid email:** Reload page. Type `notanemail` in field. Submit. Browser HTML5 validation blocks it; no POST fires (check Network tab); ack does not open.

- [ ] **Check 3 — Honeypot:** Open DevTools Console, run:
```js
document.querySelector('[name="website"]').value = 'http://spam.example';
document.getElementById('cta-email').value = 'test@example.com';
document.getElementById('cta-form').requestSubmit();
```
Network tab: POST returns 200. **No email arrives at the inbox** (honeypot silently dropped server-side).

- [ ] **Check 4 — Rate limit:** Submit form 4 times in 60 seconds from same browser. The 4th request returns 429 → inline error appears under field; ack stays closed.

- [ ] **Check 5 — Network failure:** Open DevTools → Network → set throttling to **Offline**. Reset rate limit by waiting 10 min OR using a different IP (e.g. phone hotspot). Submit form. Inline error appears: "Could not send. Please try again or email contact@ic-terminal.com directly." Ack does not open. Restore Online.

- [ ] **Check 6 — Mailto escape hatches:** Click "Contact" in top nav panel → mail client opens with `contact@ic-terminal.com`. Click "Contact" in footer → same.

- [ ] **Check 7 — Ack close affordances:** Submit a valid form to open ack. Press Escape → closes; focus returns to submit button. Reopen, click dark veil → closes. Reopen, click ✕ → closes.

If any check fails, stop and triage before declaring Phase 1 complete.

- [ ] **Final commit (if any tweaks were needed):**

```bash
git add -A
git commit -m "fix: <describe>"
git push
```

Vercel auto-redeploys on push. Re-run the failed check.

---

## Self-review (run before declaring Phase 1 done)

- [ ] All 13 tasks above checked off
- [ ] Spec's Decisions Locked table matches what was built (Resend / Vercel / Zoho / email-only / honeypot / ack copy)
- [ ] No `demo@icterminal.com` remains anywhere in `index.html`, `app.js`, `api/contact.js`, `styles.css`
- [ ] `.env` is NOT committed (only `.env.example`)
- [ ] `node_modules/` is NOT committed
- [ ] No `console.log` debug noise left in `app.js` or `api/contact.js`
- [ ] Phase 2 (mobile) and Phase 3 (custom domain) are untouched — they're separate plans

---

## Out of scope (deferred to later phases)

- Mobile responsive optimization → Phase 2
- Custom domain `ic-terminal.com` → Phase 3
- OG/meta image, favicon → Phase 3
- Cache-busting `?v=` cleanup → Phase 3
- Additional form fields, captcha, analytics → not planned
