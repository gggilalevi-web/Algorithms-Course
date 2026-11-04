# wig-demo-page

**Status:** blocked: `demo.html` was not in the repo root, so the demo page itself is not in this branch.
**Branch:** `s/wig-demo-page`. Draft PR to `main`, not merged.

## What changed
- `app/src/app/demo/salon-k7x2.html/route.ts`: new route handler, force-dynamic, nodejs runtime.
  - `EXPIRES_AT = '2026-11-06T00:00:00+02:00'`.
  - Before expiry: 200 with `src/demo-assets/salon-k7x2.html`.
  - From expiry: 410 with the self-contained RTL Hebrew page.
  - Always: `Cache-Control: no-store, max-age=0` and `X-Robots-Tag: noindex, nofollow`.
- `app/next.config.ts`: `outputFileTracingIncludes` ships the HTML file with the function.
- `app/src/proxy.ts`: matcher excludes `demo/`.

## Still needed
1. Put `demo.html` in the repo root. The next session moves it to `app/src/demo-assets/salon-k7x2.html`, adds `<meta name="robots" content="noindex, nofollow">` to `<head>`, re-runs the checks with the real file and marks the PR ready.
2. Until then, do not merge: `/demo/salon-k7x2.html` returns 500 (ENOENT). The rest of the site is unaffected.

## Test results
Local production build with a temporary fixture, since removed, and placeholder env values passed on the command line. No `.env` file was written. The server was bound to 127.0.0.1.

| Clock | Result |
|---|---|
| Real clock (2026-11-05 01:1x Israel) | 200, fixture HTML |
| Faked 2026-11-05T23:59:59+02:00 | 200, fixture HTML |
| Faked 2026-11-06T00:00:00+02:00 | 410, expired page: title, text, RTL and noindex correct, no external assets |

- The clock was faked with a preload script outside the repo, so the production constant was not changed.
- All responses carried the required `Cache-Control` and `X-Robots-Tag` headers and `text/html; charset=utf-8`.
- The build's trace file for the route lists `src/demo-assets/salon-k7x2.html`. This has not been confirmed on a real Vercel deployment.

Proxy, measured with a fake session cookie and a logging auth listener:

| Path | Result | Proxy ran |
|---|---|---|
| `/demo/salon-k7x2.html` | 200, no redirect (also 200 without a cookie) | no (it ran on `/demo/*` before the change) |
| `/demo`, `/demonstration`, `/de` | 404 | yes, so the exclusion is not a loose prefix |
| `/dashboard`, `/admin` | 307 to `/login` | yes, gates unchanged |

## Deviations from the prompt
- **The noindex meta has not been added.** There is no file to add it to yet. Only the expired page has it.
- **The matcher does not exclude `.html`, only `demo/`.** The page is now a route handler, so no static `.html` files remain. Excluding `.html` would also let `/admin/topics/x.html` and `/dashboard/topic/x.html` skip the proxy's auth checks.
- **No test file.** The app has no test runner and adding one is out of scope, so the 410 check above is not repeatable from the repo.
- **Paths are under `app/`,** because the Next app lives there. This handoff is at the repo root.

## Open items for Gila
1. **The repo is public.** Once pushed, the demo HTML is readable on GitHub, including after expiry and in git history, and the URL is visible in this PR. `EXPIRES_AT` and noindex only affect the website. Recommendation: if the demo contains anything about a real salon or customers, make the repo private or anonymize the file before it is committed.
2. **Merge timing.** After `2026-11-06T00:00:00+02:00` the route returns 410 straight away, so the merge has to happen before then.
3. **Robots and sitemap.** `main` has neither and `/robots.txt` returns 404 in production, so nothing lists `/demo/` and step 4 needed no change. The `Disallow` rule applied only if the project generated a robots file.
4. **Existing gap, not changed.** The matcher already skips paths ending in image extensions, so `/admin/topics/x.png` bypasses the proxy's checks. Not tested further. Recommendation: check separately that the admin layout enforces auth on its own.
