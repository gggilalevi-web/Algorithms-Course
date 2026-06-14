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
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: testimonials } = await admin
    .from('testimonials')
    .select('id, user_id, name, seminary, quote, approved, allow_publish, created_at')
    .order('created_at', { ascending: false })

  if (!testimonials?.length) return NextResponse.json([])

  const userIds = [...new Set(testimonials.map(t => t.user_id))]

  const [profilesRes, ...authResults] = await Promise.all([
    admin.from('profiles').select('id, name').in('id', userIds),
    ...userIds.map(id => admin.auth.admin.getUserById(id)),
  ])

  const profileMap = new Map((profilesRes.data ?? []).map(p => [p.id, p.name as string]))
  const emailMap   = new Map(
    authResults.map(r => [r.data.user?.id, r.data.user?.email ?? null])
  )

  const enriched = testimonials.map(t => ({
    ...t,
    real_name: profileMap.get(t.user_id) ?? null,
    email:     emailMap.get(t.user_id)   ?? null,
  }))

  return NextResponse.json(enriched)
}

export async function PATCH(request: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, approved } = await request.json()
  await admin.from('testimonials').update({ approved }).eq('id', id)
  return NextResponse.json({ ok: true })
}

export async function DELETE(request: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await request.json()
  await admin.from('testimonials').delete().eq('id', id)
  return NextResponse.json({ ok: true })
}
