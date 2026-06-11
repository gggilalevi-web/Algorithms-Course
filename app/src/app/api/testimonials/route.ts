import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('testimonials')
    .select('id, name, seminary, quote')
    .eq('approved', true)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json([], { status: 200 })
  return NextResponse.json(data ?? [])
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { quote, display_name, seminary } = body
  if (!quote || typeof quote !== 'string' || quote.trim().length < 10) {
    return NextResponse.json({ error: 'התגובה קצרה מדי' }, { status: 400 })
  }

  const admin = createAdminClient()
  const name = (typeof display_name === 'string' && display_name.trim()) ? display_name.trim() : 'אנונימית'

  // Prevent duplicate submissions (one per user)
  const { data: existing } = await admin
    .from('testimonials')
    .select('id')
    .eq('user_id', user.id)
    .single()

  let dbError
  if (existing) {
    const { error } = await admin
      .from('testimonials')
      .update({ name, seminary: seminary ?? null, quote: quote.trim(), approved: false })
      .eq('user_id', user.id)
    dbError = error
  } else {
    const { error } = await admin
      .from('testimonials')
      .insert({ user_id: user.id, name, seminary: seminary ?? null, quote: quote.trim() })
    dbError = error
  }

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
