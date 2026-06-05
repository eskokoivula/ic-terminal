# IC_Terminal

Single-page landing site for an institutional research product. Hand-written HTML/CSS/JS, no build step, no framework. Black background, restrained blue signal accents, mono + serif type mix.

## Files

- `index.html` — the page
- `styles.css` — all styles, hand-written, no preprocessor
- `app.js` — IIFE, plain ES2017
- `tweaks-panel.jsx`, `tweaks.jsx` — Babel-transpiled in-browser, dev-only design tweaks panel (loads only in the editor / `localhost` / `?tweaks`, never in production)
- `assets/` — logo PNG, hero video, process loop (`.webm` + `.mp4` fallback)

There is no bundler. Serve the folder with anything that handles static files (`python3 -m http.server`, `npx serve`, etc.) and open `index.html`.

## Status — Phases 1–3 complete & live

All three roadmap tasks below are **done and live** at <https://ic-terminal.com> (updated 2026-05-30). Kept for reference — the design constraints noted inside them still apply. Optional follow-ups are listed after task 3.

Original roadmap (done):

1. ✅ **DONE — Contact CTA wired to a real endpoint.** Live: `api/contact.js` → Resend → `contact@ic-terminal.com`, with honeypot + rate limit + ack overlay. (Original brief below.)
   - The CTA is now an inline form, not a `mailto:` link. Markup is `<form id="cta-form" class="cta__action cta__form">` near the bottom of `index.html`: one underlined email field (`#cta-email`, `name="email"`, `required`) above the existing `.cta__btn` (now `type="submit"`).
   - Submission handler lives in `app.js` in the `CTA request form → ACK overlay` block (search for `cta-form`). It runs `form.checkValidity()`, opens the ack overlay on success, resets the form. There is a `// TODO: POST to real endpoint here` marker — that's where the network call goes.
   - POST `{ email }` to a serverless endpoint. Recommend Resend or Postmark. Deliver to `demo@icterminal.com`. Add a honeypot field (hidden, must be empty) and a rate limit. On network failure, surface an inline error under the field — do not open the ack.
   - Nav-panel and footer still use `mailto:demo@icterminal.com`. Leave those — they are escape hatches if the form errors.
   - Do not restyle `.cta__btn` or `.cta__field` — they're tuned to the page's typographic register. No rounded SaaS pills, no gradient buttons.

2. ✅ **DONE — Mobile optimization.**
   - Target ≥375px width.
   - Test the long sections: Process, Surface/hspine, Output dashboard, Manifesto plaque, CTA.
   - Stack columns where needed, scale type down, kill side gutters that suffocate the headline.
   - Staged animations stay on mobile; accept lower keyframe complexity if needed.

3. ✅ **DONE — Domain + deploy.** Live at `ic-terminal.com` (+ `www` 308-redirect), Vercel, Let's Encrypt SSL; OG card (`assets/og-image.png`) + favicon set added.
   - Static site — Vercel or Cloudflare Pages.
   - Wire a custom domain.
   - Add proper `meta` (OG image, favicon — `assets/logo-glow.png` exists).

### Optional follow-ups (not done)

- Drop the `?v=navNN` cache-bust query strings once you trust the CDN cache headers.
- (Maybe) Check whether F-Secure Browsing Protection hides the nav for Finnish visitors broadly — a reported "missing nav" was traced to F-Secure on one machine, **not the site**. See `README.md` / `HANDOFF.md`.

## Things that look ad-hoc but are intentional — do not refactor

### `.plaque--anim` staged keyframes

`styles.css` ~lines 2628–2742. The Operating Principle quote ("A summary is not diligence. Evidence attached to the conclusions *is*.") plays as a 5-second theorem reveal: quote-open → "A summary" → strike-through bar → rule line → "Evidence attached" → italic "is." in blue → closing quote. Delays are tuned (0.05s, 0.35s, 1.35s, 2.0s, 2.55s, 3.25s, 4.8s). The strike-bar markup exists but `display:none` — leave it.

### Two stacked `<video>` elements in the Process section

`.process__anim--base` and `.process__anim--boost`. Same video playing in lockstep, boost layer masked + brightness-boosted to glow only on the IC_TERMINAL wordmark band. The sync loop in `app.js` (~line 750+) keeps their `currentTime` aligned. Don't simplify to one video.

### `mix-blend-mode: screen` on `.process__anim`

`styles.css` ~line 815. Video has a black background, page is `#000`; screen-blend makes the black drop out so only the particles + wordmark render.

**Do not add `background-color`, `opacity`, or contrast filters to the video.** Anything that lifts pure black breaks the blend and produces a visible grey rectangle.

### Three scoped `IntersectionObserver` blocks in `app.js`

At the bottom of the file: one for `.plaque--anim`, one for `#output > .reveal-item`, one for `.pdetail` bars. These override the generic `.reveal-item` observer with stricter `threshold`/`rootMargin` because the generic one fires as soon as a section's edge is visible, which made staged animations finish before the user arrived. They are not duplication; they are scoped late-triggers.

### `.process` section is `min-height: 100vh` with content anchored to top (`justify-content: flex-start`)

Deliberate — the animation needs vertical room under the headline. Don't compress it.

### Cache-busted asset query strings

`styles.css?v=nav45`, `app.js?v=nav3-3`. Used during iteration. Drop the `?v=` once it's behind a real CDN with proper cache headers.

### `tweaks.jsx` + `tweaks-panel.jsx`

Internal dev panel toggled by the editor host environment. Keep in source but make sure they don't render in production builds. The panel hides itself unless the parent posts `__activate_edit_mode` — verify that path before stripping.

### Ack overlay (`#ack`)

Confirmation popup shown after a successful CTA submission. Markup in `index.html` (`<div class="ack" id="ack" hidden>`), styles in `styles.css` under `/* ACK overlay */`, behavior in `app.js` (`openAck` / `closeAck`).

- Two-line content: `.ack__line` is the headline ("Request received."), `.ack__sub` is the muted supporting line with `(human)` rendered in serif italic blue (`em` inside `.ack__sub`). Do **not** put both into one paragraph — the headline is the message, the sub is the aside. The earlier single-sentence version got rejected for trying to be a headline.
- No status bar, no reference number, no metadata footer. Earlier iterations had a `REQ.REVIEW · RECEIVED` bar — it was cut. Don't add it back without a reason.
- Close affordances: `.ack__close` (✕ top-right of the card), clicking the veil (`.ack__veil`), or ESC. All routed through `closeAck`, which also restores body scroll and focus.
- Focus management: opening stashes `document.activeElement`, focuses the close button; closing returns focus. `aria-hidden` flips with `is-open`.

### Empty `#root` in DOM

A console warning may complain. Ignore.

## Conventions

- No bundler unless mobile perf demands one. If you add one, preserve the file structure above and keep cache-busting semantics in place.
- Edit `styles.css` directly; no preprocessor.
- `app.js` is one IIFE. Keep it that way unless you have a real reason to split.
- Don't touch the staged keyframe timings without a Loom of what's wrong.
