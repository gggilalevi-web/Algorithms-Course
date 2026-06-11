'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewTopicPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', description: '', price: '', order_index: '0' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res = await fetch('/api/admin/topic', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    if (!res.ok) {
      const data = await res.json()
      setError('שגיאה בשמירה: ' + (data.error ?? 'שגיאה לא ידועה'))
      setLoading(false)
      return
    }

    router.push('/admin/topics')
    router.refresh()
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold mb-8">נושא חדש</h1>

      <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-2xl p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">שם הנושא *</label>
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full bg-surface-elevated border border-border text-foreground rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted"
            placeholder="למשל: מיון ועצים"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">תיאור</label>
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full bg-surface-elevated border border-border text-foreground rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary resize-none placeholder:text-muted"
            placeholder="תיאור קצר של הנושא..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">מחיר (₪)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              className="w-full bg-surface-elevated border border-border text-foreground rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="0"
              dir="ltr"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">סדר (מספר)</label>
            <input
              type="number"
              min="0"
              value={form.order_index}
              onChange={(e) => setForm({ ...form, order_index: e.target.value })}
              className="w-full bg-surface-elevated border border-border text-foreground rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
              dir="ltr"
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-500/40 text-red-300 rounded-lg px-4 py-3 text-sm">{error}</div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl px-6 py-3 disabled:opacity-60"
          >
            {loading ? 'שומר...' : 'שמירה'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="border border-border text-muted hover:text-foreground rounded-xl px-6 py-3"
          >
            ביטול
          </button>
        </div>
      </form>
    </div>
  )
}
