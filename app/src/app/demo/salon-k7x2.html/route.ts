import { readFile } from 'node:fs/promises'
import path from 'node:path'

const EXPIRES_AT = '2026-11-06T00:00:00+02:00' // Israel time

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const HEADERS = {
  'Content-Type': 'text/html; charset=utf-8',
  'Cache-Control': 'no-store, max-age=0',
  'X-Robots-Tag': 'noindex, nofollow',
}

const EXPIRED_PAGE = `<!doctype html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>הדמו הסתיים</title>
<style>
body { margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 16px; box-sizing: border-box; font-family: system-ui, -apple-system, "Segoe UI", Arial, sans-serif; background: #f7f7f8; color: #1f2937; text-align: center; }
h1 { margin: 0 0 12px; font-size: 28px; }
p { margin: 0; font-size: 18px; line-height: 1.6; }
</style>
</head>
<body>
<main>
<h1>הדמו הסתיים</h1>
<p>תוקף הדמו הסתיים. לפרטים נוספים אפשר לפנות לגילה לוי - אוטוסטרדה.</p>
</main>
</body>
</html>
`

export async function GET() {
  if (Date.now() >= Date.parse(EXPIRES_AT)) {
    return new Response(EXPIRED_PAGE, { status: 410, headers: HEADERS })
  }

  const html = await readFile(
    path.join(process.cwd(), 'src/demo-assets/salon-k7x2.html'),
    'utf8'
  )
  return new Response(html, { headers: HEADERS })
}
