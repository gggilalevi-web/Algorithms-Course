'use client'

import { useState, useEffect } from 'react'

interface Testimonial {
  id: string
  user_id: string
  name: string
  seminary: string | null
  quote: string
  approved: boolean
  created_at: string
  real_name: string | null
  email: string | null
}

export default function AdminTestimonialsPage() {
  const [items, setItems] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/testimonials')
      .then(r => r.json())
      .then(data => { setItems(data); setLoading(false) })
  }, [])

  async function setApproved(id: string, approved: boolean) {
    await fetch('/api/admin/testimonials', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, approved }),
    })
    setItems(prev => prev.map(t => t.id === id ? { ...t, approved } : t))
  }

  async function remove(id: string) {
    if (!confirm('למחוק תגובה זו?')) return
    await fetch('/api/admin/testimonials', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setItems(prev => prev.filter(t => t.id !== id))
  }

  if (loading) return <div className="text-muted py-10">טוען...</div>

  const pending  = items.filter(t => !t.approved)
  const approved = items.filter(t => t.approved)

  return (
    <div className="max-w-2xl space-y-10">
      <h1 className="text-2xl font-bold text-foreground">תגובות תלמידות</h1>
      <p className="text-sm text-muted -mt-8">תגובות שתאושרנה תופענה בדף הנחיתה.</p>

      {/* Pending */}
      <section>
        <h2 className="font-semibold text-lg text-foreground mb-4">
          ממתינות לאישור
          {pending.length > 0 && (
            <span className="mr-2 text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full px-2 py-0.5">
              {pending.length}
            </span>
          )}
        </h2>
        {pending.length === 0 ? (
          <p className="text-muted text-sm">אין תגובות הממתינות לאישור.</p>
        ) : (
          <div className="space-y-3">
            {pending.map(t => (
              <TestimonialCard key={t.id} t={t} onApprove={() => setApproved(t.id, true)} onDelete={() => remove(t.id)} />
            ))}
          </div>
        )}
      </section>

      {/* Approved */}
      <section>
        <h2 className="font-semibold text-lg text-foreground mb-4">מאושרות ומוצגות</h2>
        {approved.length === 0 ? (
          <p className="text-muted text-sm">אין תגובות מאושרות עדיין.</p>
        ) : (
          <div className="space-y-3">
            {approved.map(t => (
              <TestimonialCard key={t.id} t={t} onRevoke={() => setApproved(t.id, false)} onDelete={() => remove(t.id)} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function TestimonialCard({
  t,
  onApprove,
  onRevoke,
  onDelete,
}: {
  t: Testimonial
  onApprove?: () => void
  onRevoke?: () => void
  onDelete: () => void
}) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-5 space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-0.5">
          {/* Real user info */}
          <p className="font-semibold text-foreground text-sm">{t.real_name ?? '—'}</p>
          {t.email && <p className="text-xs text-muted">{t.email}</p>}
          {(t.seminary) && <p className="text-xs text-muted">{t.seminary}</p>}
          {/* Chosen display name */}
          <p className="text-xs text-muted/50 pt-0.5">
            יופיע בפועל: <span className="text-foreground/60">{t.name}</span>
          </p>
        </div>
        <span className={`text-xs rounded-full px-2 py-0.5 font-medium shrink-0 ${
          t.approved
            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
            : 'bg-amber-500/15 text-amber-400 border border-amber-500/25'
        }`}>
          {t.approved ? 'מאושר' : 'ממתין'}
        </span>
      </div>

      <p className="text-foreground/85 text-sm leading-relaxed border-r-2 border-primary/30 pr-3">
        &quot;{t.quote}&quot;
      </p>

      <div className="flex gap-2 pt-1">
        {onApprove && (
          <button onClick={onApprove}
            className="text-xs bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/25 rounded-lg px-3 py-1.5 font-medium transition-colors">
            אישור ✓
          </button>
        )}
        {onRevoke && (
          <button onClick={onRevoke}
            className="text-xs bg-surface-elevated hover:bg-border text-muted border border-border rounded-lg px-3 py-1.5 transition-colors">
            ביטול אישור
          </button>
        )}
        <button onClick={onDelete}
          className="text-xs text-red-400/70 hover:text-red-400 border border-border hover:border-red-500/30 rounded-lg px-3 py-1.5 transition-colors mr-auto">
          מחיקה
        </button>
      </div>
    </div>
  )
}
