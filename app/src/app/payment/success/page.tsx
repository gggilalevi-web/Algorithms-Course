import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export default async function PaymentSuccessPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const topicCode = user.user_metadata?.pending_payment_topics as number | null | undefined

  // No pending payment or already processed — go to dashboard
  if (!topicCode || !Number.isInteger(topicCode) || topicCode < 1 || topicCode > 15) {
    redirect('/dashboard')
  }

  const admin = createAdminClient()

  if (topicCode === 15) {
    // Full course: replace all existing enrollments with a single full-course record
    await admin.from('enrollments').delete().eq('user_id', user.id)
    await admin.from('enrollments').insert({
      user_id: user.id,
      topic_id: null,
      is_full_course: true,
    })
  } else {
    // Individual topics: ADD to existing enrollments (preserve prior purchases)
    const { data: topics } = await admin
      .from('topics')
      .select('id, order_index')
      .order('order_index')

    if (topics && topics.length > 0) {
      const newEnrollments = topics
        .filter((_, i) => !!(topicCode & (1 << (topics.length - 1 - i))))
        .map(t => ({
          user_id: user.id,
          topic_id: t.id,
          is_full_course: false,
        }))

      if (newEnrollments.length > 0) {
        await admin.from('enrollments').insert(newEnrollments)
      }
    }
  }

  // Clear pending topicCode from metadata
  await supabase.auth.updateUser({ data: { pending_payment_topics: null } })

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden" dir="rtl">
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0" aria-hidden="true">
        <div className="aurora-1 absolute -top-40 -right-32 w-[600px] h-[600px] rounded-full bg-violet-600/20 blur-[130px]" />
        <div className="aurora-2 absolute bottom-0 -left-32 w-[500px] h-[500px] rounded-full blur-[120px]"
          style={{ background: 'rgba(6,182,212,0.12)' }} />
        <div className="aurora-3 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full blur-[120px]"
          style={{ background: 'rgba(16,185,129,0.08)' }} />
        <div className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: 'radial-gradient(rgba(124,58,237,0.8) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
            maskImage: 'radial-gradient(ellipse 70% 70% at 50% 50%, black, transparent)',
            WebkitMaskImage: 'radial-gradient(ellipse 70% 70% at 50% 50%, black, transparent)',
          }}
        />
      </div>

      <div className="relative z-10 rounded-2xl p-12 w-full max-w-md text-center"
        style={{ background: 'linear-gradient(145deg, rgba(16,185,129,0.08), rgba(124,58,237,0.1), rgba(14,14,38,0.9))', border: '1px solid rgba(16,185,129,0.25)', boxShadow: '0 0 60px rgba(16,185,129,0.1), 0 0 40px rgba(124,58,237,0.08)' }}>
        {/* Success icon */}
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.25), rgba(6,182,212,0.15))', border: '1px solid rgba(16,185,129,0.4)', boxShadow: '0 0 30px rgba(16,185,129,0.2)' }}>
          <svg className="w-10 h-10 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-3xl font-bold mb-3"
          style={{ background: 'linear-gradient(to left, #34d399, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          התשלום בוצע בהצלחה!
        </h1>
        <p className="text-muted mb-10">הגישה לנושאים שנבחרו מוכנה בשבילך. בהצלחה!</p>

        <Link
          href="/dashboard"
          className="inline-block btn-primary-glow bg-primary hover:bg-primary-hover text-white font-bold rounded-2xl px-10 py-3.5 transition-all"
        >
          כניסה לקורס ←
        </Link>
      </div>
    </div>
  )
}
