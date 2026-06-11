import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=missing_code', origin))
  }

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !data.user) {
    return NextResponse.redirect(new URL('/login?error=auth_failed', origin))
  }

  // Process pending enrollments stored in user_metadata during registration
  const meta = data.user.user_metadata ?? {}
  const pendingFullCourse = meta.pending_full_course === true
  const pendingTopics: string[] = Array.isArray(meta.pending_topics) ? meta.pending_topics : []

  if (pendingFullCourse || pendingTopics.length > 0) {
    if (pendingFullCourse) {
      await supabase.from('enrollments').insert({
        user_id: data.user.id,
        topic_id: null,
        is_full_course: true,
      })
    } else {
      await supabase.from('enrollments').insert(
        pendingTopics.map((topicId) => ({
          user_id: data.user.id,
          topic_id: topicId,
          is_full_course: false,
        }))
      )
    }
    // Clear pending data from metadata
    await supabase.auth.updateUser({
      data: { pending_full_course: null, pending_topics: null },
    })
  }

  return NextResponse.redirect(new URL(next, origin))
}
