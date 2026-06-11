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

  // Delete any existing enrollments then insert fresh ones (idempotent)
  await admin.from('enrollments').delete().eq('user_id', user.id)

  if (topicCode === 15) {
    await admin.from('enrollments').insert({
      user_id: user.id,
      topic_id: null,
      is_full_course: true,
    })
  } else {
    const { data: topics } = await admin
      .from('topics')
      .select('id, order_index')
      .order('order_index')

    if (topics && topics.length > 0) {
      const enrollments = topics
        .filter((_, i) => !!(topicCode & (1 << (topics.length - 1 - i))))
        .map(t => ({
          user_id: user.id,
          topic_id: t.id,
          is_full_course: false,
        }))

      if (enrollments.length > 0) {
        await admin.from('enrollments').insert(enrollments)
      }
    }
  }

  // Clear pending topicCode from metadata
  await supabase.auth.updateUser({ data: { pending_payment_topics: null } })

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4" dir="rtl">
      <div className="absolute inset-0 hero-glow pointer-events-none" />

      <div className="relative z-10 bg-surface border border-border rounded-2xl p-12 w-full max-w-md text-center">
        {/* Success icon */}
        <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-foreground mb-3">התשלום בוצע בהצלחה!</h1>
        <p className="text-muted mb-8">הגישה לנושאים שנבחרו מוכנה בשבילך. בהצלחה!</p>

        <Link
          href="/dashboard"
          className="inline-block bg-primary hover:bg-primary-hover text-white font-bold rounded-2xl px-10 py-3.5 transition-all hover:shadow-[0_0_24px_rgba(124,58,237,0.45)]"
        >
          כניסה לקורס ←
        </Link>
      </div>
    </div>
  )
}
