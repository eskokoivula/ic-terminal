# IC_TERMINAL

Single-page landing site for **IC_TERMINAL** — *the institutional research layer*. Hand-written HTML/CSS/JS, **no build step, no framework**. Black background, restrained blue signal accents, a mono + serif type mix.

**Live:** <https://ic-terminal.com> · `www.ic-terminal.com` redirects to it.

---

## Run locally

No bundler. Serve the folder with any static server and open `index.html`:

```bash
python3 -m http.server 8765
# then open http://localhost:8765
```

The in-browser **design tweaks panel** is dev-only: it loads only on `localhost`, inside the editor host, or when you append `?tweaks` to the URL — never in production.

---

## Project structure

| Path | What |
|------|------|
| `index.html` | The whole page (one file). |
| `styles.css` | All styles, hand-written, no preprocessor. Design tokens live in `:root` at the top. |
| `app.js` | Behaviour — one IIFE, plain ES2017 (nav, scroll reveals, dual-video sync, contact form, ack overlay). |
| `api/contact.js` | Vercel serverless function: takes the contact-form POST, validates, drops honeypot hits, rate-limits, sends via **Resend** to `contact@ic-terminal.com`. |
| `tweaks.jsx`, `tweaks-panel.jsx` | Dev-only design tweaks panel (React + Babel, transpiled in-browser). Loads only in the editor / `localhost` / `?tweaks`. |
| `package.json` | One dependency: `resend` (used by the serverless function). |
| `assets/` | Images + video — see below. |
| `CLAUDE.md` | Conventions + the “intentional, do-not-refactor” list. **Read before touching layout or animation.** |

---

## Assets (`assets/`)

**Brand / logo**
- `logo-glow.png` — nav wordmark with the glowing blue node (used in the header).
- `logo-wordmark.png`, `logo-transparent.png`, `logo-pulse.png`, `logo.png` — other logo variants.

**Social / icons**
- `og-image.png` — 1200×630 social-share card (shown when the link is shared).
- `favicon.svg`, `favicon-32.png`, `favicon-16.png`, `favicon-512.png` — browser-tab icons.
- `apple-touch-icon.png` — 180×180 icon for the iOS home screen.

**Video**
- `hero-bg.mp4` — hero background.
- `mid-bg.mp4` — mid-page background.
- `demo.mp4` — product demo clip.
- `logo-loop.webm` + `logo-loop.mp4` — Process-section loop (webm with mp4 fallback).
- `logo-animation.mp4` — logo animation clip.

**Misc**
- `dashboard.png` — output-dashboard still.

---

## Fonts

Loaded from Google Fonts (the `<link>` in `index.html`), referenced via CSS variables in `:root`:

| Token | Family | Use |
|-------|--------|-----|
| `--sans` | **Geist** | Body and most UI. |
| `--mono` | **Geist Mono** | Labels, the IC_TERMINAL wordmark, terminal feel. |
| `--serif` | **Instrument Serif** (italic) | Editorial accents in headlines. |

---

## Colors

Every accent derives from a **single** signal color, so re-tinting is one change. Defined in `styles.css` `:root`:

| Token | Value | Use |
|-------|-------|-----|
| `--signal` | `#4d9fff` | The one accent (blue). All blues derive from this. |
| `--blue-soft` / `--blue-dim` / `--blue-glow` | derived via `color-mix` | Softer / faint / glow variants of `--signal`. |
| `--amber` | `#d9a441` | Secondary accent. |
| `--red` | `#e26a6a` | Alert / secondary. |
| `--bg` | `#000000` | Page background. |
| `--surface` … `--surface-3` | `#0d0c1c` → `#1a1932` | Raised panels. |
| `--text` … `--text-4` | `#f3f4f7` → `#353a48` | Text, brightest → faintest. |
| `--line` … `--line-3` | white @ 6% → 20% | Hairlines / borders. |

Layout and motion tokens also live in `:root`: `--max` (max width), `--gutter`, `--ease` (shared easing), `--tempo` / `--stagger` (animation timing).

---

## Deploy

- **Host:** Vercel. Push to `main` → auto-deploy (~seconds).
- **Domain:** `ic-terminal.com` (registrar GoDaddy; DNS stays at GoDaddy, apex `A` record → Vercel). `www` 308-redirects to the apex. SSL via Let’s Encrypt, automatic.
- **Email:** `contact@ic-terminal.com` (Zoho) + Resend (form) + Amazon SES — all via DNS records, independent of the host.

---

## More

- **`CLAUDE.md`** — working conventions and the list of deliberately unusual code that must not be “cleaned up” (staged keyframes, dual-video screen blend, scoped observers, the `.process` 100vh section, the ack overlay). Read it first.
- `SPEC-phase-1-contact-form.md`, `PLAN-phase-1-contact-form.md` — archival design docs for the contact form.
