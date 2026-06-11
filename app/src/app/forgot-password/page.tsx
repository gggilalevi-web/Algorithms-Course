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

  if (sent) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-border p-8 w-full max-w-md text-center">
          <div className="text-5xl mb-4">📧</div>
          <h1 className="text-2xl font-bold mb-3">בדקי את תיבת הדואר שלך</h1>
          <p className="text-muted mb-2">שלחנו קישור לאיפוס סיסמה לכתובת:</p>
          <p className="font-semibold mb-6" dir="ltr">{email}</p>
          <p className="text-muted text-sm mb-8">
            לחצי על הקישור שבמייל כדי לקבוע סיסמה חדשה.
            <br />
            הקישור בתוקף לשעה אחת. לא קיבלת? בדקי בספאם.
          </p>
          <Link href="/login" className="text-primary hover:underline text-sm">
            חזרה לדף הכניסה
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-border p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">איפוס סיסמה</h1>
          <p className="text-muted mt-2 text-sm">
            הכניסי את כתובת המייל שלך ונשלח לך קישור לקביעת סיסמה חדשה
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1.5">אימייל</label>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="your@email.com"
              dir="ltr"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary-hover text-white font-semibold rounded-lg py-3 disabled:opacity-60"
          >
            {loading ? 'שולחת...' : 'שליחת קישור לאיפוס'}
          </button>
        </form>

        <p className="text-center text-sm text-muted mt-6">
          <Link href="/login" className="text-primary hover:underline">← חזרה לכניסה</Link>
        </p>
      </div>
    </div>
  )
}
