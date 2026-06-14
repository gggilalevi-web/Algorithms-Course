'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type NameChoice = 'anonymous' | 'initial' | 'full'

export default function TestimonialForm({ profileName = '' }: { profileName?: string }) {
  const [open,        setOpen]        = useState(false)
  const [quote,       setQuote]       = useState('')
  const [nameChoice,  setNameChoice]  = useState<NameChoice>('initial')
  const [showSem,     setShowSem]     = useState(false)
  const [allowPublish, setAllowPublish] = useState(true)
  const [status,      setStatus]      = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [seminary,    setSeminary]    = useState('')

  useEffect(() => {
    if (!open) return
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      const meta = data.user?.user_metadata ?? {}
      setSeminary(meta.seminary ?? '')
    })
  }, [open])

  // profiles.name is "שם פרטי שם משפחה" — first word = first name
  const firstName = profileName.trim().split(/\s+/)[0] ?? ''

  function resolvedName(): string {
    if (nameChoice === 'anonymous') return 'אנונימית'
    if (nameChoice === 'initial')   return firstName ? firstName[0] + '׳' : 'א׳'
    return firstName || 'אנונימית'
  }

  async function handleSubmit() {
    if (status === 'sending') return
    setStatus('sending')
    try {
      const res = await fetch('/api/testimonials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quote:        quote.trim(),
          display_name: resolvedName(),
          seminary:     showSem ? seminary : null,
          allow_publish: allowPublish,
        }),
      })
      setStatus(res.ok ? 'sent' : 'error')
    } catch {
      setStatus('error')
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-sm text-muted hover:text-accent underline underline-offset-4 transition-colors"
      >
        ✍ השאירי לנו תגובה על הקורס
      </button>
    )
  }

  return (
    <div className="bg-surface border border-border rounded-2xl p-6 w-full max-w-lg mx-auto">
      <h3 className="font-bold text-foreground mb-1">תגובה על הקורס</h3>
      <p className="text-xs text-muted mb-5">תגובות שתאושרנה על ידינו תופענה בדף הבית.</p>

      {status === 'sent' ? (
        <div className="text-center py-4">
          <p className="text-emerald-400 font-semibold mb-1">תודה! ✓</p>
          <p className="text-muted text-sm">התגובה נשלחה ותוצג לאחר אישור.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <textarea
            value={quote}
            onChange={e => setQuote(e.target.value)}
            rows={4}
            maxLength={300}
            placeholder="ספרי בכמה מילים על החוויה שלך עם הקורס..."
            className="w-full bg-surface-elevated border border-border-light text-foreground placeholder:text-muted rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          />

          {/* Name display choice */}
          <div>
            <p className="text-xs font-medium text-foreground mb-2">כיצד יופיע שמך?</p>
            <div className="flex flex-wrap gap-2">
              {([
                ['anonymous', 'אנונימית'],
                ['initial',   `אות ראשונה (${firstName.charAt(0) || 'א'}׳)`],
                ['full',      `שם פרטי (${firstName || '—'})`],
              ] as [NameChoice, string][]).map(([val, label]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setNameChoice(val)}
                  className={`text-xs rounded-lg px-3 py-1.5 border transition-colors ${
                    nameChoice === val
                      ? 'border-primary bg-primary/10 text-accent font-semibold'
                      : 'border-border text-muted hover:border-primary/50'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Seminary toggle */}
          {seminary && (
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showSem}
                onChange={e => setShowSem(e.target.checked)}
                className="w-4 h-4 rounded accent-primary"
              />
              <span className="text-xs text-muted">
                לציין את הסמינר <span className="text-foreground/70">({seminary})</span>
              </span>
            </label>
          )}

          {/* Publish consent */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={!allowPublish}
              onChange={e => setAllowPublish(!e.target.checked)}
              className="w-4 h-4 rounded accent-primary"
            />
            <span className="text-xs text-muted">אינני מעוניינת שהתגובה תתפרסם</span>
          </label>

          <div className="flex items-center justify-between gap-3 pt-1">
            <span className="text-xs text-muted">{quote.length}/300</span>
            <div className="flex gap-2">
              <button type="button" onClick={() => setOpen(false)}
                className="text-xs text-muted hover:text-foreground border border-border rounded-lg px-3 py-1.5">
                ביטול
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={status === 'sending'}
                className="text-xs bg-primary hover:bg-primary-hover text-white font-semibold rounded-lg px-4 py-1.5 disabled:opacity-60">
                {status === 'sending' ? 'שולח...' : 'שליחה'}
              </button>
            </div>
          </div>
          {status === 'error' && (
            <p className="text-xs text-red-400">שגיאה בשליחה, נסי שוב.</p>
          )}
        </div>
      )}
    </div>
  )
}
