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

export async function POST(request: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const topicId = formData.get('topicId') as string | null

  if (!file || !topicId) return NextResponse.json({ error: 'Missing params' }, { status: 400 })

  const safeName = file.name.replace(/[^\w.\-]/g, '_')
  const path = `${topicId}/${Date.now()}_${safeName}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const { error: uploadError } = await admin.storage
    .from('pdfs')
    .upload(path, buffer, { contentType: 'application/pdf', upsert: false })

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  const { data: pdfRow, error: dbError } = await admin
    .from('pdfs')
    .insert({ topic_id: topicId, name: file.name.replace(/\.pdf$/i, ''), storage_path: path })
    .select()
    .single()

  if (dbError || !pdfRow) return NextResponse.json({ error: 'DB error' }, { status: 500 })

  return NextResponse.json(pdfRow, { status: 201 })
}
