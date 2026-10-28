# Task: Wig-studio landing page + lead form, built 1:1 from a finished design

Context: This repo is my Autostrada site (gilaleviautostrada.com, Next.js 16 on Vercel). The Next.js
app lives in `app/` (all paths below are relative to `app/`). I'm adding a
marketing landing page for a product I built: a management system for home-based wig stylists
("פאניות"). I present it to wig stylists TOMORROW EVENING, so this must be production-ready tonight.
Scope is strictly additive. Do not touch the course, auth, payment or webhook code.

The design is FINISHED and lives at `docs/landing/wig-studio-reference.html` (a single self-contained
file: markup, CSS, vanilla JS, embedded fonts). Open it in a browser first and play with it.
Your job is a faithful port, not a redesign. Same structure, same copy, same tokens, same spacing,
same breakpoints, same interactions. Fonts and the poster image are embedded in the reference as
base64 only so it opens standalone; in the app they are real files. If something cannot be ported exactly, stop and tell me why
instead of improvising.

## Step 0: Look before you build
- Work on the existing branch `landing-wig-studio` (it already holds the reference and the images).
- Report: Next.js version, router, styling approach (Tailwind version / CSS modules / global CSS),
  how fonts are loaded today, where the Autostrada logo assets live (I want the light document
  version: charcoal #1A1D23 wordmark, lime swoosh), and whether an earlier lead form exists whose
  patterns you should reuse. Show me this report, then continue without waiting.

## Step 1: Route and structure
- Public route `/wig-studio` (App Router). Server component page; client components only where the
  reference has JS: hero demo board, missed-calls log, channel switcher, color swatches, video poster,
  form, sticky header state, mobile sticky CTA.
- All Hebrew copy in `content.ts` next to the page, copied verbatim from the reference, so I can edit
  text without touching JSX. Also in content.ts:
  - `YOUTUBE_ID = 'uXpNpIjjWMo'`. Clicking the poster swaps in a `youtube-nocookie.com/embed` iframe
    exactly like the reference does (no YouTube request before the click), plus the small fallback link
    "לצפייה ביוטיוב" under the frame. If the ID is empty, the poster shows "הסרטון יעלה כאן בקרוב."
  - The video poster image is `public/wig-studio/poster.webp` (in the reference it is embedded as a
    data URL; use the file instead, with `next/image` or a CSS background, priority off).
  - `VOICES`: the three WhatsApp-style quotes from the "מהצד של הסטודיו" section, copied verbatim.
    Do NOT add, invent or reword any testimonial.
- `lang="he" dir="rtl"` on the page wrapper. Logical CSS properties only, as in the reference.
- `metadata`: title "מערכת לניהול סטודיו לפאות | Autostrada", the reference's description, OG tags.
  Add the route to the sitemap if the site has one.
- This page has its own header and footer (the ones in the reference). The root layout
  (`src/app/layout.tsx`) renders a global footer and the dark `bg-background` body. Approved minimal
  change: move that footer into a tiny client component (`src/components/SiteFooter.tsx`) that returns
  null when `usePathname()` starts with `/wig-studio`, and give the page wrapper its own background so
  the body color never shows. Change nothing else in the root layout; the Rubik font variable may stay.
- `src/proxy.ts` already leaves `/wig-studio` and `/api/leads/*` public. Do not change the proxy.

## Step 2: Styling port
- Port the reference CSS as a CSS module (or the repo's convention) scoped to this route. Keep the
  `:root` tokens as variables on the page wrapper, not on the global :root.
- Fonts via `next/font/google` (self-hosted at build, no runtime Google request; many visitors are on
  NetFree): Bellefair 400 (display) and Assistant 400/500/600/700 (body), subsets hebrew + latin,
  exposed as the `--display` / `--body` variables. Keep `font-synthesis: none`. Remove the embedded
  base64 fonts.
- Footer = the animated Autostrada signature from the reference (black band, lime rays drawn from
  the centre, glow, wordmark blur-in, lime line wiped in). The two logo layers are
  `public/wig-studio/logo-text.webp` and `public/wig-studio/logo-line.webp` (embedded as data URLs in
  the reference only). Keep it pure CSS/SVG: no video file, because NetFree filters video.
- Keep `prefers-reduced-motion` handling, focus-visible styles and the 44px+ tap targets.
- No third-party scripts, no external images, no analytics added by this task.

## Step 3: Interactions (port the reference JS to React, same behaviour and timings)
- Hero demo: rows move from "בטיפול בסטודיו" to "מוכנות לאיסוף" with the FLIP animation; the phone
  rings with the customer's name; chip goes "מתקשרת..." then "קיבלה שיחה HH:MM"; the green call bar
  shows on mobile instead of the phone; counts update; the hint pulse + tip after the first auto-run;
  the board resets when all rows are done. Auto-run starts only when the board is 60% in view.
- Missed-calls log: starts once when in view, same list and cadence, counter starts at 3.
- Channel switcher (שיחה / מייל / וואטסאפ) with the same preview markup; swatches recolor the mini
  dashboard via the three CSS variables.
- Header turns solid after 30px scroll; mobile sticky CTA shows after the hero and hides when the
  form is on screen.

## Step 4: Lead endpoint (the form already posts this exact contract)
- `POST /api/leads/wig-studio` (route handler, Node runtime). Body:
  `{ name, phone, city, volume, message, consent, company, source }`.
- Validate server-side with zod (add it only if the repo has no validator): name 2-60 chars; phone
  matches `^0(5\d{8}|[2-489]\d{7}|7\d{8})$` after stripping spaces/dashes; city <= 40;
  volume one of "", "עד 20", "20 עד 50", "50 עד 100", "מעל 100"; message <= 500; consent boolean;
  source `^[a-z0-9_-]{1,30}$` else "direct". Reject bodies > 4KB.
- `company` (honeypot) non-empty: return 200 `{ ok: true }` and do nothing.
- Best-effort per-IP throttle (in-memory Map, 5 requests / 10 min). Comment that on serverless it is
  only a speed bump.
- Forward to `process.env.LEADS_WEBHOOK_URL` with
  `{ secret: process.env.LEADS_WEBHOOK_SECRET, name, phone, city, volume, message, source, consent }`
  via fetch (POST, JSON, default redirect follow: Apps Script answers with a 302). Parse the JSON;
  anything but `ok: true` is a failure (return 502 `{ ok:false }`). 8s timeout via AbortController.
- Read env vars inside the handler, never at module scope; never expose them to the client. Missing
  env: 500 plus a clear server log line.
- Never log name/phone. Log only success/failure + source.

## Step 5: Verify before you hand back
- `npm run build` and lint pass.
- Side-by-side check against the reference at 375px, 768px and 1440px: hero, demo run, every section,
  form states (field errors, sending, success, failure). Take screenshots and list any visual diff
  you could not eliminate.
- Endpoint tests with a local stub webhook (never my real sheet): valid lead, honeypot, invalid phone,
  oversized body, missing env, webhook returning ok:false.
- Confirm only these changed: the new route, the API route, `src/components/SiteFooter.tsx`, the one
  footer line in `src/app/layout.tsx`, and the sitemap if one exists.
- Commit on the branch with a clear message. Do not merge and do not deploy: I'll review the Vercel
  preview first.

Finish with: the list of files, the preview steps, and anything you were unsure about.
