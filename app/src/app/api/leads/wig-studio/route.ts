import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

export const runtime = 'nodejs'

const MAX_BODY_BYTES = 4096
const RATE_LIMIT = 5
const RATE_WINDOW_MS = 10 * 60 * 1000
const WEBHOOK_TIMEOUT_MS = 8000
const LOG = '[leads/wig-studio]'

const LeadSchema = z.object({
  name: z.string().trim().min(2).max(60),
  phone: z.string().transform(v => v.replace(/[\s-]/g, '')).pipe(z.string().regex(/^0(5\d{8}|[2-489]\d{7}|7\d{8})$/)),
  city: z.string().trim().max(40).optional().default(''),
  volume: z.enum(['', 'עד 20', '20 עד 50', '50 עד 100', 'מעל 100']).optional().default(''),
  message: z.string().trim().max(500).optional().default(''),
  consent: z.boolean().optional().default(false),
  // anything missing or malformed becomes "direct" instead of rejecting the lead
  source: z.string().regex(/^[a-z0-9_-]{1,30}$/).catch('direct'),
})

// Best-effort per-IP throttle. On serverless each instance has its own memory and
// instances come and go, so this is only a speed bump, not real rate limiting.
const hits = new Map<string, { count: number; resetAt: number }>()

function throttled(ip: string) {
  const now = Date.now()
  if (hits.size > 5000) for (const [k, v] of hits) if (v.resetAt <= now) hits.delete(k)
  const entry = hits.get(ip)
  if (!entry || entry.resetAt <= now) {
    hits.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS })
    return false
  }
  entry.count++
  return entry.count > RATE_LIMIT
}

// Reads the body but gives up as soon as it passes the limit; null means too large.
async function readBody(request: NextRequest): Promise<string | null> {
  const declared = Number(request.headers.get('content-length'))
  if (declared > MAX_BODY_BYTES) return null
  if (!request.body) return ''
  const reader = request.body.getReader()
  const chunks: Uint8Array[] = []
  let size = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    size += value.byteLength
    if (size > MAX_BODY_BYTES) { await reader.cancel(); return null }
    chunks.push(value)
  }
  return Buffer.concat(chunks).toString('utf8')
}

const fail = (status: number) => NextResponse.json({ ok: false }, { status })

export async function POST(request: NextRequest) {
  const raw = await readBody(request)
  if (raw === null) return fail(413)

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || request.headers.get('x-real-ip') || 'unknown'
  if (throttled(ip)) return fail(429)

  let body: unknown
  try { body = JSON.parse(raw) } catch { return fail(400) }
  if (!body || typeof body !== 'object') return fail(400)

  // honeypot: pretend it worked, do nothing
  const company = (body as { company?: unknown }).company
  if (typeof company === 'string' && company.trim() !== '') return NextResponse.json({ ok: true })

  const parsed = LeadSchema.safeParse(body)
  if (!parsed.success) return fail(400)
  const lead = parsed.data

  const url = process.env.LEADS_WEBHOOK_URL
  const secret = process.env.LEADS_WEBHOOK_SECRET
  if (!url || !secret) {
    console.error(`${LOG} missing env: LEADS_WEBHOOK_URL and/or LEADS_WEBHOOK_SECRET is not set`)
    return fail(500)
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), WEBHOOK_TIMEOUT_MS)
  try {
    // Apps Script answers the POST with a 302; fetch follows it (default redirect: 'follow')
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret, name: lead.name, phone: lead.phone, city: lead.city, volume: lead.volume,
        message: lead.message, source: lead.source, consent: lead.consent,
      }),
      signal: controller.signal,
    })
    const data = await res.json().catch(() => null)
    if (data?.ok !== true) {
      console.error(`${LOG} webhook rejected lead`, { source: lead.source, status: res.status })
      return fail(502)
    }
  } catch (err) {
    const reason = controller.signal.aborted ? 'timeout' : (err as Error).name
    console.error(`${LOG} webhook request failed`, { source: lead.source, reason })
    return fail(502)
  } finally {
    clearTimeout(timer)
  }

  console.log(`${LOG} lead forwarded`, { source: lead.source })
  return NextResponse.json({ ok: true })
}
