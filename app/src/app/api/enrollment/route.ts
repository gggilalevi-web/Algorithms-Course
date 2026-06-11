import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'לא מחוברת' }, { status: 401 })

  const { fullCourse, topicIds } = await request.json()

  if (!fullCourse && (!Array.isArray(topicIds) || topicIds.length === 0)) {
    return NextResponse.json({ error: 'יש לבחור לפחות נושא אחד' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { error: delError } = await admin.from('enrollments').delete().eq('user_id', user.id)
  if (delError) {
    console.error('enrollment delete error:', delError)
    return NextResponse.json({ error: 'שגיאה במחיקת הרשמות קיימות' }, { status: 500 })
  }

  const rows = fullCourse
    ? [{ user_id: user.id, topic_id: null, is_full_course: true }]
    : (topicIds as string[]).map((topicId) => ({
        user_id: user.id,
        topic_id: topicId,
        is_full_course: false,
      }))

  const { error: insError } = await admin.from('enrollments').insert(rows as any[])
  if (insError) {
    console.error('enrollment insert error:', insError)
    return NextResponse.json({ error: 'שגיאה בשמירת ההרשמות' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
