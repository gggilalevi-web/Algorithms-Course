'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/auth/callback?next=/auth/reset-password`,
    })

    setLoading(false)
    if (error) {
      setError('שגיאה בשליחת המייל. נסי שוב.')
      return
    }
    setSent(true)
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

  if (sent) {
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
          <p className="text-muted mb-2 text-sm">שלחנו קישור לאיפוס סיסמה לכתובת:</p>
          <p className="font-semibold text-accent mb-6" dir="ltr">{email}</p>
          <p className="text-muted text-sm mb-8 leading-relaxed">
            לחצי על הקישור שבמייל כדי לקבוע סיסמה חדשה.
            <br />
            הקישור בתוקף לשעה אחת. לא קיבלת? בדקי בספאם.
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
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5 mb-5">
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
          <h1 className="text-3xl font-bold text-foreground">איפוס סיסמה</h1>
          <p className="text-muted text-sm mt-1.5">
            הכניסי את כתובת המייל שלך ונשלח לך קישור לקביעת סיסמה חדשה
          </p>
        </div>

        <div className="rounded-2xl p-8"
          style={{ background: 'linear-gradient(145deg, rgba(124,58,237,0.1), rgba(14,14,38,0.85))', border: '1px solid rgba(124,58,237,0.3)', boxShadow: '0 0 40px rgba(124,58,237,0.1)' }}>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">אימייל</label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-surface-elevated border border-border-light text-foreground placeholder:text-muted rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                placeholder="your@email.com"
                dir="ltr"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/25 text-red-400 rounded-xl px-4 py-3 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary-glow bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl py-3 disabled:opacity-60"
            >
              {loading ? 'שולחת...' : 'שליחת קישור לאיפוס'}
            </button>
          </form>

          <p className="text-center text-sm text-muted mt-6">
            <Link href="/login" className="text-accent hover:text-primary font-medium">← חזרה לכניסה</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
