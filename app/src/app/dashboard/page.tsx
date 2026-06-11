import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import TestimonialForm from '@/components/ui/TestimonialForm'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Topic, Enrollment } from '@/lib/types'

const CARD_STYLES = [
  { bg: 'linear-gradient(135deg, rgba(124,58,237,0.22), rgba(14,14,38,0.75))', border: 'rgba(124,58,237,0.38)', numColor: '#a78bfa', numBg: 'rgba(124,58,237,0.18)', glow: 'rgba(124,58,237,0.18)' },
  { bg: 'linear-gradient(135deg, rgba(6,182,212,0.18), rgba(14,14,38,0.75))',   border: 'rgba(6,182,212,0.32)',   numColor: '#22d3ee', numBg: 'rgba(6,182,212,0.15)',   glow: 'rgba(6,182,212,0.15)'   },
  { bg: 'linear-gradient(135deg, rgba(16,185,129,0.18), rgba(14,14,38,0.75))',  border: 'rgba(16,185,129,0.32)',  numColor: '#34d399', numBg: 'rgba(16,185,129,0.15)',  glow: 'rgba(16,185,129,0.15)'  },
  { bg: 'linear-gradient(135deg, rgba(245,158,11,0.18), rgba(14,14,38,0.75))',  border: 'rgba(245,158,11,0.32)',  numColor: '#fbbf24', numBg: 'rgba(245,158,11,0.15)',  glow: 'rgba(245,158,11,0.15)'  },
]

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()
  const [{ data: profile }, { data: enrollments }] = await Promise.all([
    admin.from('profiles').select('name, role').eq('id', user.id).single(),
    supabase.from('enrollments').select('*').eq('user_id', user.id),
  ])

  const isAdmin = profile?.role === 'admin'
  if (!isAdmin && Array.isArray(enrollments) && enrollments.length === 0) redirect('/select-topics')

  const isFullCourse = isAdmin || (enrollments?.some((e: Enrollment) => e.is_full_course) ?? false)
  const enrolledTopicIds = new Set(
    enrollments?.filter((e: Enrollment) => !e.is_full_course).map((e: Enrollment) => e.topic_id) ?? []
  )

  const { data: allTopics } = await supabase.from('topics').select('*').order('order_index')
  const accessibleTopics = (allTopics as Topic[] | null)?.filter(
    (t) => isFullCourse || enrolledTopicIds.has(t.id)
  ) ?? []

  async function handleSignOut() {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
  }

  const firstName = profile?.name?.split(' ')[0] ?? null

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden">

      {/* Aurora background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0" aria-hidden="true">
        <div className="aurora-1 absolute -top-40 -right-32 w-[650px] h-[650px] rounded-full bg-violet-600/15 blur-[140px]" />
        <div className="aurora-2 absolute top-1/2 -left-40 w-[550px] h-[550px] rounded-full blur-[120px]"
          style={{ background: 'rgba(6,182,212,0.09)' }} />
        <div className="aurora-3 absolute bottom-0 right-1/3 w-[600px] h-[600px] rounded-full bg-violet-500/10 blur-[160px]" />
        <div className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: 'linear-gradient(rgba(124,58,237,1) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,1) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }}
        />
      </div>

      {/* Header */}
      <header className="relative z-10 sticky top-0 bg-surface/70 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(6,182,212,0.15))', border: '1px solid rgba(124,58,237,0.4)' }}>
              <span className="text-violet-300 font-bold text-sm">א</span>
            </div>
            <div className="leading-snug">
              <span className="font-bold text-sm"
                style={{ background: 'linear-gradient(to left, #a78bfa, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                אלגוריתמים א׳
              </span>
              {firstName && (
                <span className="text-muted text-sm mr-2">| שלום, {firstName} 👋</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            {profile?.role === 'admin' && (
              <Link href="/admin"
                className="text-xs font-semibold border rounded-lg px-3 py-1.5 transition-all hover:opacity-80"
                style={{ color: '#06b6d4', borderColor: 'rgba(6,182,212,0.35)', background: 'rgba(6,182,212,0.07)' }}>
                ממשק ניהול
              </Link>
            )}
            <form action={handleSignOut}>
              <button type="submit" className="text-sm text-muted hover:text-foreground transition-colors">
                יציאה
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-4xl mx-auto px-6 py-12">

        {/* Welcome section */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2.5 rounded-full px-4 py-1.5 mb-5 text-sm font-semibold"
            style={{ background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.28)', color: '#06b6d4' }}>
            <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block animate-pulse shrink-0" />
            {isFullCourse ? 'גישה מלאה לקורס' : `${accessibleTopics.length} נושאים פעילים`}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground leading-tight">
            {firstName ? `שלום, ${firstName}` : 'ברוכה הבאה'}
          </h1>
          <p className="mt-2 text-xl font-semibold"
            style={{ background: 'linear-gradient(to left, #a78bfa, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {isFullCourse ? 'כל הנושאים שלך מחכים ←' : 'הנושאים שלי'}
          </p>
        </div>

        {/* Divider */}
        <div className="h-px mb-10"
          style={{ background: 'linear-gradient(to left, transparent, rgba(124,58,237,0.4), rgba(6,182,212,0.3), transparent)' }} />

        {accessibleTopics.length === 0 ? (
          <div className="rounded-2xl p-12 text-center"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(124,58,237,0.2)' }}>
            <div className="text-5xl mb-5">📚</div>
            <p className="text-muted text-lg mb-5">עדיין אין לך גישה לנושאים</p>
            <Link href="/select-topics"
              className="inline-block bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl px-6 py-3 text-sm transition-all hover:shadow-[0_0_24px_rgba(124,58,237,0.45)]">
              בחירת נושאים ←
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {accessibleTopics.map((topic, i) => {
              const s = CARD_STYLES[i % CARD_STYLES.length]
              return (
                <Link key={topic.id} href={`/dashboard/topic/${topic.id}`}
                  className="group relative rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1.5 overflow-hidden"
                  style={{ background: s.bg, border: `1px solid ${s.border}` }}>
                  {/* Hover glow */}
                  <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none"
                    style={{ boxShadow: `0 0 55px ${s.glow} inset, 0 8px 40px -8px ${s.glow}` }} />
                  <div className="relative z-10 flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="mb-3">
                        <span className="text-xs font-bold rounded-lg px-2 py-0.5 tabular-nums"
                          style={{ background: s.numBg, color: s.numColor, border: `1px solid ${s.border}` }}>
                          {String(i + 1).padStart(2, '0')}
                        </span>
                      </div>
                      <h2 className="font-bold text-lg text-foreground group-hover:text-white transition-colors leading-snug">
                        {topic.name}
                      </h2>
                      {topic.description && (
                        <p className="text-muted text-sm mt-1.5 line-clamp-2 leading-relaxed">{topic.description}</p>
                      )}
                    </div>
                    <span className="text-xl shrink-0 mt-1 transition-transform duration-300 group-hover:-translate-x-1.5"
                      style={{ color: s.numColor }}>←</span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {accessibleTopics.length > 0 && !isAdmin && (
          <div className="mt-8 text-center">
            <Link href="/select-topics" className="text-xs text-muted hover:text-accent underline underline-offset-4 transition-colors">
              עדכון הנושאים שלי
            </Link>
          </div>
        )}

        {!isAdmin && (
          <div className="mt-16 flex justify-center">
            <TestimonialForm profileName={profile?.name ?? ''} />
          </div>
        )}

      </main>
    </div>
  )
}
