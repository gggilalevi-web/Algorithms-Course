import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
  return profile?.role === 'admin' ? admin : null
}

export async function GET() {
  const admin = createAdminClient()
  const { data, error } = await admin.from('settings').select('key, value')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const map = Object.fromEntries((data ?? []).map(r => [r.key, r.value]))
  return NextResponse.json(map)
}

export async function PATCH(request: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const updates = await request.json() as Record<string, string>
  for (const [key, value] of Object.entries(updates)) {
    await admin.from('settings').upsert({ key, value: String(value) })
  }
  return NextResponse.json({ ok: true })
}
