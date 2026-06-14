import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const [{ data: profiles }, { data: enrollments }] = await Promise.all([
    admin.from('profiles').select('id, name, role, created_at').eq('role', 'student').order('created_at', { ascending: false }),
    admin.from('enrollments').select('id, user_id, topic_id, is_full_course, created_at'),
  ])

  if (!profiles?.length) return NextResponse.json([])

  const userIds = profiles.map(p => p.id)

  const authResults = await Promise.all(userIds.map(id => admin.auth.admin.getUserById(id)))

  const authMap = new Map(
    authResults.map(r => [
      r.data.user?.id,
      { email: r.data.user?.email ?? '', seminary: r.data.user?.user_metadata?.seminary ?? '' },
    ])
  )

  const enrollmentsByUser = new Map<string, typeof enrollments>()
  for (const e of enrollments ?? []) {
    if (!enrollmentsByUser.has(e.user_id)) enrollmentsByUser.set(e.user_id, [])
    enrollmentsByUser.get(e.user_id)!.push(e)
  }

  const result = profiles.map(p => ({
    ...p,
    email:     authMap.get(p.id)?.email    ?? '',
    seminary:  authMap.get(p.id)?.seminary ?? '',
    enrollments: enrollmentsByUser.get(p.id) ?? [],
  }))

  return NextResponse.json(result)
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await request.json()
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  // deleteUser removes the auth record; profiles/enrollments cascade via DB foreign keys
  const { error } = await admin.auth.admin.deleteUser(id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
