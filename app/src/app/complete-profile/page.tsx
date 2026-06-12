'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function CompleteProfilePage() {
  return (
    <Suspense>
      <CompleteProfileForm />
    </Suspense>
  )
}

function CompleteProfileForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? '/select-topics'

  const [name, setName] = useState('')
  const [seminary, setSeminary] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [initializing, setInitializing] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      const meta = data.user?.user_metadata ?? {}
      // Pre-fill name from Google's full_name or existing name
      if (!name) setName(meta.name ?? meta.full_name ?? '')
      if (!seminary && meta.seminary) setSeminary(meta.seminary)
      setInitializing(false)
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('נא למלא שם מלא'); return }
    if (!seminary.trim()) { setError('נא למלא שם סמינר'); return }

    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({
      data: { name: name.trim(), seminary: seminary.trim() },
    })

    if (updateError) {
      setError('שגיאה בשמירת הפרטים. נסי שוב.')
      setLoading(false)
      return
    }

    router.push(next)
    router.refresh()
  }

  if (initializing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted">טוען...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
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

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
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
          <h1 className="text-3xl font-bold text-foreground">עוד כמה פרטים</h1>
          <p className="text-muted text-sm mt-1.5">כדי להשלים את ההרשמה</p>
        </div>

        <div className="rounded-2xl p-8"
          style={{ background: 'linear-gradient(145deg, rgba(124,58,237,0.1), rgba(14,14,38,0.85))', border: '1px solid rgba(124,58,237,0.3)', boxShadow: '0 0 40px rgba(124,58,237,0.1)' }}>
          {error && (
            <div className="bg-red-500/10 border border-red-500/25 text-red-400 rounded-xl px-4 py-3 text-sm mb-5">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">שם מלא</label>
              <input
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-surface-elevated border border-border-light text-foreground placeholder:text-muted rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="השם המלא שלך"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">סמינר</label>
              <input
                required
                value={seminary}
                onChange={e => setSeminary(e.target.value)}
                className="w-full bg-surface-elevated border border-border-light text-foreground placeholder:text-muted rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="שם הסמינר שלך"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary-glow bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl py-3 disabled:opacity-60 mt-1"
            >
              {loading ? 'שומר...' : 'המשך ←'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-muted mt-6">
          <Link href="/login" className="text-accent hover:text-primary">
            חזרה לדף הכניסה
          </Link>
        </p>
      </div>
    </div>
  )
}
