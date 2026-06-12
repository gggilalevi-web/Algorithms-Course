'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Topic } from '@/lib/types'

// Encode selected topics to a binary code.
// Topics sorted by order_index ascending: topic[0] is MSB, topic[n-1] is LSB.
// Example with 4 topics: bit values are 8 (topic 1), 4, 2, 1 (topic 4).
// Full course = 15 (all bits set).
function encodeTopics(
  isFullCourse: boolean,
  selectedIds: Set<string>,
  topics: Topic[]
): number {
  if (isFullCourse) return 15
  const sorted = [...topics].sort((a, b) => a.order_index - b.order_index)
  let code = 0
  sorted.forEach((topic, i) => {
    if (selectedIds.has(topic.id)) {
      code |= 1 << (sorted.length - 1 - i)
    }
  })
  return code
}

export default function SelectTopicsPage() {
  const router = useRouter()
  const supabase = createClient()

  const [topics, setTopics] = useState<Topic[]>([])
  const [selectedTopics, setSelectedTopics] = useState<Set<string>>(new Set())
  const [fullCourse, setFullCourse] = useState(false)
  const [fullCoursePrice, setFullCoursePrice] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const [{ data: t }, { data: e }] = await Promise.all([
        supabase.from('topics').select('*').order('order_index'),
        supabase.from('enrollments').select('id').eq('user_id', user.id).limit(1),
      ])

      // Already paid → no second purchase allowed
      if (e && e.length > 0) {
        router.push('/dashboard')
        return
      }

      setTopics((t as Topic[]) ?? [])

      fetch('/api/admin/settings')
        .then(r => r.json())
        .then(data => { if (data.full_course_price) setFullCoursePrice(Number(data.full_course_price)) })
        .catch(() => {})

      setLoading(false)
    }
    load()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const canPay = fullCourse || selectedTopics.size > 0

  const displayTotal = (() => {
    if (!canPay) return 0
    const sorted = [...topics].sort((a, b) => a.order_index - b.order_index)
    const code = encodeTopics(fullCourse, selectedTopics, topics)
    if (code === 15 && fullCoursePrice != null) return fullCoursePrice
    return sorted.filter(t => fullCourse || selectedTopics.has(t.id)).reduce((s, t) => s + t.price, 0)
  })()

  async function handlePayment(e: React.FormEvent) {
    e.preventDefault()
    if (!canPay || paying) return

    setPaying(true)
    setError(null)

    const topicCode = encodeTopics(fullCourse, selectedTopics, topics)

    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topicCode }),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'אירעה שגיאה, נסי שוב')
      setPaying(false)
      return
    }

    const { url } = await res.json()
    window.location.href = url
  }

  function toggleTopic(id: string) {
    setSelectedTopics(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-3 text-muted">
          <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          טוען...
        </div>
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
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2.5 mb-2">
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
        </div>

        <div className="rounded-2xl p-8"
          style={{ background: 'linear-gradient(145deg, rgba(124,58,237,0.1), rgba(14,14,38,0.85))', border: '1px solid rgba(124,58,237,0.3)', boxShadow: '0 0 40px rgba(124,58,237,0.1)' }}>
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold"
              style={{ background: 'linear-gradient(to left, #a78bfa, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              בחירת נושאים
            </h1>
            <p className="text-muted mt-2 text-sm">בחרי את הנושאים שברצונך ללמוד ועברי לתשלום</p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/25 text-red-400 rounded-xl px-4 py-3 text-sm mb-5">
              {error}
            </div>
          )}

          <form onSubmit={handlePayment} className="space-y-3">
            {/* Full course option */}
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
                  <p className="text-sm text-muted mt-0.5">
                    גישה לכל הנושאים
                    {fullCoursePrice != null && (
                      <span className="font-semibold text-accent"> ₪{fullCoursePrice}</span>
                    )}
                  </p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center ${
                  fullCourse ? 'border-primary' : 'border-border-light'
                }`}>
                  {fullCourse && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                </div>
              </div>
            </button>

            {/* Individual topics */}
            {topics.length > 0 && (
              <>
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
                        <div className="flex items-center gap-2 shrink-0">
                          {topic.price > 0 && (
                            <span className="text-xs text-muted font-medium">₪{topic.price}</span>
                          )}
                          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                            selected ? 'border-primary bg-primary' : 'border-border-light'
                          }`}>
                            {selected && <span className="text-white text-xs leading-none">✓</span>}
                          </div>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </>
            )}

            {/* Total + payment button */}
            <div className="pt-3 space-y-3">
              {canPay && displayTotal > 0 && (
                <div className="flex items-center justify-between px-1 text-sm">
                  <span className="text-muted">סה״כ לתשלום:</span>
                  <span className="font-bold text-lg text-foreground">₪{displayTotal}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={paying || !canPay}
                className="w-full btn-primary-glow bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl py-3 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {paying ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    מעביר לתשלום...
                  </>
                ) : canPay && displayTotal > 0 ? (
                  `לתשלום ₪${displayTotal} ←`
                ) : (
                  'לתשלום ←'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
