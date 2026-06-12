import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
// Validate required env vars at module load — fail loudly on startup if missing
const MAKE_WEBHOOK_URL = process.env.MAKE_WEBHOOK_URL
const WEBHOOK_SECRET   = process.env.WEBHOOK_SECRET
if (!MAKE_WEBHOOK_URL || !WEBHOOK_SECRET) {
  throw new Error('[checkout] Missing required env vars: MAKE_WEBHOOK_URL, WEBHOOK_SECRET')
}


export async function POST(request: NextRequest) {

  // ── 1. Authentication ──────────────────────────────────────────────────────
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'לא מחוברת' }, { status: 401 })
  }

  // ── 2. Input validation ───────────────────────────────────────────────────
  let topicCode: number
  try {
    const body = await request.json()
    topicCode = body.topicCode
  } catch {
    return NextResponse.json({ error: 'קלט לא תקין' }, { status: 400 })
  }

  if (!Number.isInteger(topicCode) || topicCode < 1 || topicCode > 15) {
    return NextResponse.json(
      { error: 'קוד נושאים לא תקין — חייב להיות מספר שלם בין 1 ל-15' },
      { status: 400 }
    )
  }

  // ── 3. Get student info + topics + settings from server ──────────────────
  const admin = createAdminClient()
  const [{ data: profile }, { data: topicsRows }, { data: settingRow }] = await Promise.all([
    admin.from('profiles').select('name').eq('id', user.id).single(),
    admin.from('topics').select('name, price, order_index').order('order_index'),
    admin.from('settings').select('value').eq('key', 'full_course_price').single(),
  ])

  const studentName  = profile?.name
                    ?? user.user_metadata?.name
                    ?? user.user_metadata?.full_name
                    ?? ''
  const studentEmail = user.email ?? ''

  // ── 4. Build item list + calculate price from DB (never trust client) ─────
  const allTopics = (topicsRows ?? []) as { name: string; price: number; order_index: number }[]
  const fullCoursePrice = settingRow ? Number(settingRow.value) : null
  const pickedTopics = allTopics.filter((_, i) => !!(topicCode & (1 << (allTopics.length - 1 - i))))

  let selectedItems: { name: string; price: string; quantity: string; vatType: number }[]

  if (topicCode === 15 && fullCoursePrice != null) {
    selectedItems = [{ name: 'קורס מלא', price: String(fullCoursePrice), quantity: '1', vatType: 1 }]
  } else {
    selectedItems = pickedTopics.map(t => ({
      name:     t.name,
      price:    String(Math.round(t.price)),
      quantity: '1',
      vatType:  1,
    }))
  }

  const amount = selectedItems.reduce((sum, t) => sum + Number(t.price), 0)

  // ── 5. Build payload ──────────────────────────────────────────────────────
  const origin = new URL(request.url).origin
  const ts = Date.now()
  const payload = {
    topics:       topicCode,
    amount,
    data:         selectedItems,
    studentName,
    studentEmail,
    successUrl:   `${origin}/payment/success`,
    cancelUrl:    `${origin}/select-topics`,
    ts,
    regId:        crypto.randomUUID(),
  }
  const payloadStr = JSON.stringify(payload)

  // ── 6. POST to Make webhook ───────────────────────────────────────────────
  let paymentUrl: string
  try {
    const controller = new AbortController()
    const timeoutId  = setTimeout(() => controller.abort(), 10_000)

    const makeRes = await fetch(MAKE_WEBHOOK_URL!, {
      method:  'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-sign':  WEBHOOK_SECRET!,
      },
      body:   payloadStr,
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    if (!makeRes.ok) {
      console.error('[checkout] Make returned', makeRes.status, await makeRes.text().catch(() => ''))
      return NextResponse.json(
        { error: 'אירעה תקלה ביצירת דף התשלום, נסי שוב מאוחר יותר' },
        { status: 502 }
      )
    }

    const rawBody = await makeRes.text().catch(() => '')
    let resolvedUrl: string | null = null

    // Accept either plain-text URL or JSON { url: "..." }
    if (rawBody.startsWith('http')) {
      resolvedUrl = rawBody.trim()
    } else {
      try { resolvedUrl = (JSON.parse(rawBody) as { url?: string }).url ?? null } catch { /* not JSON */ }
    }

    if (!resolvedUrl) {
      console.error('[checkout] Make returned no URL. Status:', makeRes.status, 'Body:', rawBody)
      return NextResponse.json(
        { error: 'אירעה תקלה ביצירת דף התשלום, נסי שוב מאוחר יותר' },
        { status: 502 }
      )
    }
    paymentUrl = resolvedUrl

  } catch (err) {
    const isTimeout = err instanceof Error && err.name === 'AbortError'
    console.error('[checkout] Make fetch failed:', isTimeout ? 'timeout after 10s' : err)
    return NextResponse.json(
      { error: 'אירעה תקלה ביצירת דף התשלום, נסי שוב מאוחר יותר' },
      { status: 502 }
    )
  }

  // ── 8. Store pending topicCode in metadata — read by /payment/success ─────
  await supabase.auth.updateUser({ data: { pending_payment_topics: topicCode } })

  return NextResponse.json({ url: paymentUrl })
}
