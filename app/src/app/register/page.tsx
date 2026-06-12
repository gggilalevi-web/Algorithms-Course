'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Topic } from '@/lib/types'

type Step = 'details' | 'topics' | 'confirm'

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  )
}

function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const planParam = searchParams.get('plan')
  const topicIdParam = searchParams.get('topicId')

  const [step, setStep] = useState<Step>('details')
  const [topics, setTopics] = useState<Topic[]>([])
  const [form, setForm] = useState({ name: '', seminary: '', email: '', password: '', confirmPassword: '' })
  const [selectedTopics, setSelectedTopics] = useState<Set<string>>(
    topicIdParam ? new Set([topicIdParam]) : new Set()
  )
  const [fullCourse, setFullCourse] = useState(planParam === 'full')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase.from('topics').select('*').order('order_index').then(({ data }) => {
      if (data) setTopics(data as Topic[])
    })
  }, [])

  function setField(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setError(null)
  }

  async function handleGoogleSignUp() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${location.origin}/auth/callback?next=/select-topics` },
    })
  }

  async function handleDetailsSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) { setError('נא למלא שם מלא'); return }
    if (!form.seminary.trim()) { setError('נא למלא שם סמינר'); return }
    if (form.password.length < 6) { setError('הסיסמה חייבת להכיל לפחות 6 תווים'); return }
    if (form.password !== form.confirmPassword) { setError('הסיסמאות אינן תואמות'); return }
    setError(null)
    setStep('topics')
  }

  async function handleFinalSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!fullCourse && selectedTopics.size === 0) {
      setError('יש לבחור לפחות נושא אחד, או בחרי בקורס המלא')
      return
    }
    setLoading(true)
    setError(null)

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          name: form.name,
          seminary: form.seminary,
          pending_full_course: fullCourse,
          pending_topics: fullCourse ? [] : Array.from(selectedTopics),
        },
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    })

    if (signUpError) {
      const msg = signUpError.message.includes('already registered')
        ? 'כתובת המייל כבר רשומה במערכת'
        : signUpError.message
      setError(msg)
      setLoading(false)
      return
    }

    if (data.session) {
      const userId = data.user!.id
      const { error: enrollError } = fullCourse
        ? await supabase.from('enrollments').insert({
            user_id: userId,
            topic_id: null,
            is_full_course: true,
          })
        : await supabase.from('enrollments').insert(
            Array.from(selectedTopics).map((topicId) => ({
              user_id: userId,
              topic_id: topicId,
              is_full_course: false,
            }))
          )

      if (enrollError) {
        console.error('Enrollment insert failed:', enrollError.message)
        router.push('/select-topics?from=register')
        router.refresh()
        return
      }

      router.push('/dashboard')
      router.refresh()
      return
    }

    setStep('confirm')
    setLoading(false)
  }

  function toggleTopic(id: string) {
    setSelectedTopics((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const Aurora = () => (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0" aria-hidden="true">
      <div className="aurora-1 absolute -top-40 -right-32 w-[600px] h-[600px] rounded-full bg-violet-600/20 blur-[130px]" />
      <div className="aurora-2 absolute bottom-0 -left-32 w-[500px] h-[500px] rounded-full blur-[120px]"
        style={{ background: 'rgba(6,182,212,0.12)' }} />
      <div className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: 'radial-gradient(rgba(124,58,237,0.8) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          maskImage: 'radial-gradient(ellipse 70% 70% at 50% 50%, black, transparent)',
          WebkitMaskImage: 'radial-gradient(ellipse 70% 70% at 50% 50%, black, transparent)',
        }}
      />
    </div>
  )

  // ── Confirm screen ────────────────────────────────────────────────────────
  if (step === 'confirm') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
        <Aurora />
        <div className="relative z-10 rounded-2xl p-10 w-full max-w-md text-center"
          style={{ background: 'linear-gradient(145deg, rgba(124,58,237,0.1), rgba(14,14,38,0.85))', border: '1px solid rgba(124,58,237,0.3)', boxShadow: '0 0 40px rgba(124,58,237,0.1)' }}>
          <div className="w-16 h-16 rounded-full mx-auto mb-5 flex items-center justify-center text-3xl"
            style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(6,182,212,0.15))', border: '1px solid rgba(124,58,237,0.3)' }}>
            📧
          </div>
          <h1 className="text-2xl font-bold mb-3"
            style={{ background: 'linear-gradient(to left, #a78bfa, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            בדקי את תיבת הדואר שלך
          </h1>
          <p className="text-muted mb-2 text-sm">שלחנו לינק לאימות לכתובת:</p>
          <p className="font-semibold text-accent mb-6" dir="ltr">{form.email}</p>
          <p className="text-muted text-sm mb-8 leading-relaxed">
            לחצי על הקישור שבמייל כדי לאמת את חשבונך ולהיכנס לקורס.
            <br />
            אם לא קיבלת — בדקי בתיקיית הספאם.
          </p>
          <Link href="/login" className="text-accent hover:text-primary text-sm font-medium">
            חזרה לדף הכניסה ←
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <Aurora />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2.5 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.35), rgba(6,182,212,0.2))', border: '1px solid rgba(124,58,237,0.45)' }}>
              <span className="text-violet-300 font-bold">א</span>
            </div>
            <div className="leading-snug text-right">
              <span className="font-bold text-lg"
                style={{ background: 'linear-gradient(to left, #a78bfa, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                אלגוריתמים א׳
              </span>
              <p className="text-[10px] text-muted/60">גילה לוי · אולטרה קוד</p>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground">הרשמה לקורס</h1>

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mt-5">
            {(['details', 'topics'] as const).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                {i > 0 && (
                  <div className={`h-0.5 w-10 transition-colors ${step === 'topics' ? 'bg-primary' : 'bg-border'}`} />
                )}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  s === step
                    ? 'bg-primary text-white'
                    : step === 'topics' && s === 'details'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-surface border border-border text-muted'
                }`}>
                  {step === 'topics' && s === 'details' ? '✓' : i + 1}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl p-8"
          style={{ background: 'linear-gradient(145deg, rgba(124,58,237,0.1), rgba(14,14,38,0.85))', border: '1px solid rgba(124,58,237,0.3)', boxShadow: '0 0 40px rgba(124,58,237,0.1)' }}>
          {error && (
            <div className="bg-red-500/10 border border-red-500/25 text-red-400 rounded-xl px-4 py-3 text-sm mb-5">
              {error}
            </div>
          )}

          {/* ── Step 1: Details ──────────────────────────────────────────── */}
          {step === 'details' && (
            <>
              <button
                type="button"
                onClick={handleGoogleSignUp}
                className="w-full flex items-center justify-center gap-3 border border-border-light rounded-xl px-4 py-3 hover:bg-surface-elevated text-foreground font-medium mb-5 transition-all"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                הרשמה עם Google
              </button>

              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 h-px bg-border" />
                <span className="text-muted text-xs">או עם אימייל</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              <form onSubmit={handleDetailsSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">שם מלא</label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setField('name', e.target.value)}
                    className="w-full bg-surface-elevated border border-border-light text-foreground placeholder:text-muted rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="השם המלא שלך"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">סמינר</label>
                  <input
                    required
                    value={form.seminary}
                    onChange={(e) => setField('seminary', e.target.value)}
                    className="w-full bg-surface-elevated border border-border-light text-foreground placeholder:text-muted rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="שם הסמינר שלך"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">אימייל</label>
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={(e) => setField('email', e.target.value)}
                    className="w-full bg-surface-elevated border border-border-light text-foreground placeholder:text-muted rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="your@email.com"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">סיסמה</label>
                  <input
                    required
                    type="password"
                    value={form.password}
                    onChange={(e) => setField('password', e.target.value)}
                    className="w-full bg-surface-elevated border border-border-light text-foreground placeholder:text-muted rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="לפחות 6 תווים"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">אימות סיסמה</label>
                  <input
                    required
                    type="password"
                    value={form.confirmPassword}
                    onChange={(e) => setField('confirmPassword', e.target.value)}
                    className="w-full bg-surface-elevated border border-border-light text-foreground placeholder:text-muted rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="הכניסי שוב את הסיסמה"
                    dir="ltr"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full btn-primary-glow bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl py-3 mt-1"
                >
                  המשך לבחירת נושאים ←
                </button>
              </form>
            </>
          )}

          {/* ── Step 2: Topics ───────────────────────────────────────────── */}
          {step === 'topics' && (
            <form onSubmit={handleFinalSubmit} className="space-y-3">
              <p className="text-sm text-muted mb-4">בחרי את הנושאים שברצונך ללמוד:</p>

              <button
                type="button"
                onClick={() => { setFullCourse(true); setSelectedTopics(new Set()) }}
                className={`w-full text-right rounded-xl border-2 px-5 py-4 transition-all ${
                  fullCourse ? 'border-primary bg-primary/10' : 'border-border-light hover:border-primary/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-foreground">קורס מלא — כל הנושאים</p>
                    <p className="text-sm text-muted mt-0.5">גישה לכל הנושאים הקיימים והעתידיים</p>
                  </div>
                  <Radio checked={fullCourse} />
                </div>
              </button>

              {topics.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-muted text-center py-1">— או נושאים בנפרד —</p>
                  {topics.map((topic) => {
                    const selected = !fullCourse && selectedTopics.has(topic.id)
                    return (
                      <button
                        key={topic.id}
                        type="button"
                        onClick={() => { setFullCourse(false); toggleTopic(topic.id) }}
                        className={`w-full text-right rounded-xl border-2 px-4 py-3 transition-all ${
                          selected ? 'border-primary bg-primary/10' : 'border-border-light hover:border-primary/60'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-medium text-sm text-foreground">{topic.name}</span>
                          <Checkbox checked={selected} />
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setStep('details'); setError(null) }}
                  className="border border-border-light rounded-xl px-4 py-3 text-muted hover:text-foreground hover:border-accent text-sm"
                >
                  ← חזרה
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 btn-primary-glow bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl py-3 disabled:opacity-60"
                >
                  {loading ? 'נרשם...' : 'הרשמה וכניסה'}
                </button>
              </div>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-muted mt-6">
          כבר יש לך חשבון?{' '}
          <Link href="/login" className="text-accent hover:text-primary font-medium">כניסה</Link>
        </p>
      </div>
    </div>
  )
}

function Radio({ checked }: { checked: boolean }) {
  return (
    <div className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${
      checked ? 'border-primary' : 'border-border-light'
    }`}>
      {checked && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
    </div>
  )
}

function Checkbox({ checked }: { checked: boolean }) {
  return (
    <div className={`w-4 h-4 rounded border-2 shrink-0 flex items-center justify-center transition-colors ${
      checked ? 'border-primary bg-primary' : 'border-border-light'
    }`}>
      {checked && <span className="text-white text-xs leading-none">✓</span>}
    </div>
  )
}
