import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return null
  return admin
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: topicId } = await params

  const [{ data: topic }, { data: lessons }, { data: pdfs }, { data: sections }] = await Promise.all([
    admin.from('topics').select('*').eq('id', topicId).single(),
    admin.from('lessons').select('*').eq('topic_id', topicId).order('order_index'),
    admin.from('pdfs').select('*').eq('topic_id', topicId),
    admin.from('sections').select('*').eq('topic_id', topicId).order('order_index'),
  ])

  return NextResponse.json({
    topic: topic ?? null,
    lessons: lessons ?? [],
    pdfs: pdfs ?? [],
    sections: sections ?? [],
  })
}
