'use client'

import { useState, useEffect } from 'react'

export default function AdminSettingsPage() {
  const [fullCoursePrice, setFullCoursePrice] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/settings')
      .then(r => r.json())
      .then(data => {
        setFullCoursePrice(data.full_course_price ?? '')
        setLoading(false)
      })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const price = parseFloat(fullCoursePrice)
    if (isNaN(price) || price <= 0) { setError('יש להזין מחיר תקין'); return }

    setSaving(true)
    setError(null)
    const res = await fetch('/api/admin/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_course_price: String(price) }),
    })
    setSaving(false)
    if (!res.ok) { setError('שגיאה בשמירה'); return }
    setSuccess(true)
    setTimeout(() => setSuccess(false), 2500)
  }

  if (loading) return <div className="text-muted py-10">טוען...</div>

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-foreground mb-8">הגדרות</h1>

      <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-2xl p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            מחיר קורס מלא (₪)
          </label>
          <p className="text-xs text-muted mb-3">
            מחיר מוזל לרכישת כל הנושאים יחד. הנחה זו תחול במקום סכום הנושאים הבודדים.
          </p>
          <input
            type="number"
            min="1"
            step="1"
            required
            value={fullCoursePrice}
            onChange={e => setFullCoursePrice(e.target.value)}
            className="w-full bg-surface-elevated border border-border-light text-foreground rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
            dir="ltr"
          />
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/25 text-red-400 rounded-xl px-4 py-3 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-success/10 border border-success/25 text-success rounded-xl px-4 py-3 text-sm">
            נשמר בהצלחה ✓
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl px-6 py-2.5 text-sm disabled:opacity-60"
        >
          {saving ? 'שומר...' : 'שמירה'}
        </button>
      </form>
    </div>
  )
}
