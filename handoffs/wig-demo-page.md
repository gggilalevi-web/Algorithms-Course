# wig-demo-page

**Status:** waiting
**Branch:** `s/wig-demo-page`. PR to `main`, not merged.

## Waiting for
1. PR #1 ready: https://github.com/gggilalevi-web/Algorithms-Course/pull/1. Merge? Recommendation: yes, after the preview check under "Open items", and before `2026-11-06T00:00:00+02:00`. After that time the page returns 410 as soon as it is deployed.

## What changed
- `app/src/demo-assets/salon-k7x2.html`: the demo page, moved from `demo.html`. The only content change is the added `<meta name="robots" content="noindex, nofollow">`.
- `app/src/app/demo/salon-k7x2.html/route.ts`: new route handler, force-dynamic, nodejs runtime.
  - `EXPIRES_AT = '2026-11-06T00:00:00+02:00'`.
  - Before expiry: 200 with the demo HTML.
  - From expiry: 410 with the self-contained RTL Hebrew page.
  - Always: `Cache-Control: no-store, max-age=0` and `X-Robots-Tag: noindex, nofollow`.
- `app/next.config.ts`: `outputFileTracingIncludes` ships the HTML file with the function.
- `app/src/proxy.ts`: matcher excludes `demo/`.

## Test results
Local production build with the real file. Placeholder env values were passed on the command line, no `.env` file was written, and the server was bound to 127.0.0.1.

| Clock | Result |
|---|---|
| Real clock (2026-11-05 01:2x Israel) | 200, served bytes identical to the repo file, noindex meta present |
| Faked 2026-11-05T23:59:59+02:00 | 200, same |
| Faked 2026-11-06T00:00:00+02:00 | 410, expired page: title, text and noindex correct, no external URLs |

- The clock was faked with a preload script outside the repo, so the production constant was not changed.
- All responses carried the required `Cache-Control` and `X-Robots-Tag` headers and `text/html; charset=utf-8`.
- The file hash on `origin/s/wig-demo-page` matches the tested file.
- The build's trace file for the route lists the HTML file, and the Vercel preview for `a11d19c` built successfully.

Proxy, measured with a fake session cookie and a logging auth listener:

| Path | Result | Proxy ran |
|---|---|---|
| `/demo/salon-k7x2.html` | 200, no redirect (also 200 without a cookie; HEAD 200) | no |
| `/demo`, `/demonstration`, `/de` | 404 | yes, so the exclusion is not a loose prefix |
| `/dashboard`, `/admin` | 307 to `/login` | yes, gates unchanged |

## Not verified
- **The page on Vercel.** The preview is behind Vercel SSO, so requests from the server get a 302 to the Vercel login. The build succeeded, but the page has not been loaded from a Vercel deployment.

## Deviations from the prompt
- **The matcher does not exclude `.html`, only `demo/`.** The page is a route handler, so no static `.html` files remain. Excluding `.html` would also let `/admin/topics/x.html` and `/dashboard/topic/x.html` skip the proxy's auth checks.
- **No test file.** The app has no test runner and adding one is out of scope, so the 410 check above is not repeatable from the repo.
- **Paths are under `app/`,** because the Next app lives there. This handoff is at the repo root.
- **Two commits for one file change.** `d3100ab` has only the rename, because a `git add` failed; `a11d19c` adds the noindex line. A squash merge hides this.

## Open items for Gila
1. **Preview check.** While logged in to Vercel, open https://algorithms-course-u5rkw2ngx-gila-levi-s-projects.vercel.app/demo/salon-k7x2.html. Expected: the demo page. A 500 would mean the file was not bundled, so do not merge.
2. **After merge.** `main` deploys to production. Open https://gilaleviautostrada.com/demo/salon-k7x2.html (currently 404). Expected: the demo page.
3. **Public repo (decided: proceed, the demo data is all fake).** The HTML stays readable on GitHub after expiry and in git history.
4. **Google Fonts.** The demo page loads fonts from `fonts.googleapis.com`, so its visitors' browsers contact Google. The expired page has no external assets.
5. **Robots and sitemap.** `main` has neither and `/robots.txt` returns 404 in production, so nothing lists `/demo/` and step 4 needed no change.
6. **Existing gap, not changed.** The matcher already skips paths ending in image extensions, so `/admin/topics/x.png` bypasses the proxy's checks. Not tested further. Recommendation: check separately that the admin layout enforces auth on its own.
