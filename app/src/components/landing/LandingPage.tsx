'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Topic } from '@/lib/types'

const USE_GROW_PAYMENTS = false
const FULL_COURSE_HREF = USE_GROW_PAYMENTS ? 'https://grow.me/full-course' : '/register?plan=full'
const TOPIC_HREF = (id: string) =>
  USE_GROW_PAYMENTS ? 'https://grow.me/topic' : `/register?plan=topic&topicId=${id}`

const NAV_LINKS = [
  { href: '#pain',         label: 'מכירה את זה?' },
  { href: '#why',          label: 'למה דווקא כאן' },
  { href: '#features',     label: 'מה כלול' },
  { href: '#topics',       label: 'נושאים' },
  { href: '#enroll',       label: 'הרשמה' },
]

interface Props { topics: Topic[] }

export default function LandingPage({ topics }: Props) {
  const router = useRouter()
  const [scrolled,      setScrolled]      = useState(false)
  const [menuOpen,      setMenuOpen]      = useState(false)
  const [activeSection, setActiveSection] = useState('')
  const [authUser,      setAuthUser]      = useState<{ email: string } | null>(null)
  const [dbTestimonials, setDbTestimonials] = useState<{ id: string; name: string; seminary: string | null; quote: string }[]>([])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      setAuthUser(data.user?.email ? { email: data.user.email } : null)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setAuthUser(session?.user?.email ? { email: session.user.email } : null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = useCallback(async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.refresh()
  }, [router])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!menuOpen) return
    const close = () => setMenuOpen(false)
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [menuOpen])

  useEffect(() => {
    fetch('/api/testimonials')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setDbTestimonials(data) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const onScroll = () => {
      const midpoint = window.scrollY + window.innerHeight * 0.4
      let current = ''
      for (const { href } of NAV_LINKS) {
        const el = document.getElementById(href.slice(1))
        if (el && el.offsetTop <= midpoint) current = href.slice(1)
      }
      setActiveSection(current)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const io = new IntersectionObserver(
      entries => entries.forEach(e => {
        const el = e.target as HTMLElement
        if (e.isIntersecting) {
          el.removeAttribute('data-exiting')
          el.classList.add('visible')
        } else {
          el.dataset.exiting = '1'
          el.classList.remove('visible')
          requestAnimationFrame(() => el.removeAttribute('data-exiting'))
        }
      }),
      { threshold: 0.1 }
    )
    document.querySelectorAll('.reveal,.reveal-left,.reveal-right,.reveal-scale')
      .forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [])

  const handleNavClick = useCallback((e: React.MouseEvent, href: string) => {
    e.preventDefault()
    setMenuOpen(false)
    if (href === '#') { window.scrollTo({ top: 0, behavior: 'smooth' }); return }
    const el = document.getElementById(href.slice(1))
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 80, behavior: 'smooth' })
  }, [])

  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-x-hidden">

      {/* ── Aurora ─────────────────────────────────────────────────────── */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0" aria-hidden="true">
        <div className="aurora-1 absolute -top-40 -right-32 w-[700px] h-[700px] rounded-full bg-violet-600/20 blur-[140px]" />
        <div className="aurora-2 absolute top-1/3 -left-40 w-[550px] h-[550px] rounded-full blur-[120px]"
          style={{ background: 'rgba(6,182,212,0.12)' }} />
        <div className="aurora-3 absolute bottom-10 right-1/4 w-[600px] h-[600px] rounded-full bg-violet-500/15 blur-[160px]" />
        <div className="aurora-4 absolute top-2/3 left-1/3 w-[420px] h-[420px] rounded-full blur-[100px]"
          style={{ background: 'rgba(6,182,212,0.08)' }} />
        <div className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: 'linear-gradient(rgba(124,58,237,1) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,1) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }}
        />
      </div>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-background/80 backdrop-blur-2xl border-b border-border/40 shadow-xl shadow-black/30' : 'bg-transparent'
      }`}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="#" onClick={e => handleNavClick(e, '#')} className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(6,182,212,0.15))', border: '1px solid rgba(124,58,237,0.35)' }}>
              <span className="text-violet-300 font-bold text-sm">א</span>
            </div>
            <div className="leading-snug">
              <span className="text-foreground font-semibold text-sm">גילה לוי</span>
              <span className="text-muted/50 mx-1.5 text-xs">·</span>
              <span className="font-bold text-sm"
                style={{ background: 'linear-gradient(to left, #a78bfa, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                אוטוסטרדה
              </span>
            </div>
          </a>

          <nav className="hidden md:flex items-center gap-0.5">
            {NAV_LINKS.map(({ href, label }) => {
              const isActive = activeSection === href.slice(1)
              return (
                <a key={href} href={href} onClick={e => handleNavClick(e, href)}
                  className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    isActive ? 'text-cyan-400 bg-cyan-500/10 shadow-[0_0_12px_rgba(6,182,212,0.15)]'
                             : 'text-muted hover:text-foreground hover:bg-white/5'}`}>
                  {label}
                </a>
              )
            })}
          </nav>

          <div className="flex items-center gap-3">
            {authUser ? (
              <div className="hidden md:flex items-center gap-3">
                <div className="flex items-center gap-2 text-sm text-muted border border-border-light rounded-xl px-3 py-2"
                  style={{ background: 'rgba(16,185,129,0.06)', borderColor: 'rgba(16,185,129,0.25)' }}>
                  <span className="w-2 h-2 rounded-full bg-green-400 shrink-0" />
                  <span className="text-foreground/80 font-medium">
                    {authUser.email.split('@')[0]}
                  </span>
                </div>
                <button onClick={handleLogout}
                  className="text-sm text-muted hover:text-foreground border border-border-light hover:border-border rounded-xl px-3 py-2 transition-all">
                  יציאה
                </button>
              </div>
            ) : (
              <Link href="/login"
                className="hidden md:inline-flex items-center gap-1.5 text-sm font-medium text-accent border border-border-light hover:border-cyan-500/50 hover:text-cyan-400 rounded-xl px-4 py-2 transition-all hover:shadow-[0_0_16px_rgba(6,182,212,0.2)]">
                כניסה לקורס <span aria-hidden>←</span>
              </Link>
            )}
            <button className="md:hidden flex flex-col gap-1.5 p-2 rounded-lg hover:bg-white/5"
              onClick={e => { e.stopPropagation(); setMenuOpen(o => !o) }}
              aria-label="פתח תפריט" aria-expanded={menuOpen}>
              <span className={`block w-5 h-0.5 bg-foreground rounded transition-transform duration-200 ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
              <span className={`block w-5 h-0.5 bg-foreground rounded transition-opacity duration-200 ${menuOpen ? 'opacity-0' : ''}`} />
              <span className={`block w-5 h-0.5 bg-foreground rounded transition-transform duration-200 ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden bg-surface/95 backdrop-blur-2xl border-b border-border px-6 py-4 space-y-1"
            onClick={e => e.stopPropagation()}>
            {NAV_LINKS.map(({ href, label }) => (
              <a key={href} href={href} onClick={e => handleNavClick(e, href)}
                className="block px-4 py-2.5 rounded-xl text-sm font-medium text-muted hover:text-foreground hover:bg-white/5 transition-all">
                {label}
              </a>
            ))}
            {authUser ? (
              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-2 px-4 py-2.5 text-sm text-foreground/70 rounded-xl"
                  style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)' }}>
                  <span className="w-2 h-2 rounded-full bg-green-400 shrink-0" />
                  מחובר: {authUser.email.split('@')[0]}
                </div>
                <button onClick={handleLogout}
                  className="w-full text-center border border-border-light rounded-xl px-4 py-2.5 text-sm font-medium text-muted hover:text-foreground transition-all">
                  יציאה
                </button>
              </div>
            ) : (
              <Link href="/login"
                className="block mt-3 text-center border border-border-light rounded-xl px-4 py-2.5 text-sm font-medium text-accent hover:border-cyan-500/50 hover:text-cyan-400 transition-all">
                כניסה לקורס ←
              </Link>
            )}
          </div>
        )}
      </header>

      <main className="relative z-10">

        {/* ══ HERO ════════════════════════════════════════════════════════ */}
        <section className="relative pt-36 pb-28 px-6 text-center overflow-hidden">
          <div className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(rgba(124,58,237,0.12) 1px, transparent 1px)',
              backgroundSize: '26px 26px',
              maskImage: 'radial-gradient(ellipse 90% 90% at 50% 40%, black 20%, transparent 80%)',
              WebkitMaskImage: 'radial-gradient(ellipse 90% 90% at 50% 40%, black 20%, transparent 80%)',
            }}
          />

          <div className="relative z-10 max-w-4xl mx-auto">
            {/* Badge */}
            <div className="reveal inline-flex items-center gap-2.5 rounded-full px-5 py-2 mb-10 text-sm font-semibold"
              style={{ background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.28)', color: '#06b6d4' }}>
              <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block animate-pulse shrink-0" />
              מותאם 100% לתכנית אולטרה קוד&nbsp;&nbsp;•&nbsp;&nbsp;גילה לוי - אוטוסטרדה
            </div>

            {/* Headline */}
            <h1 className="reveal stagger-1 font-bold mb-6 leading-[1.1]"
              style={{ fontSize: 'clamp(2.6rem, 7vw, 5.5rem)' }}>
              לעבור את
              <span className="block" style={{
                background: 'linear-gradient(to left, #c4b5fd, #a78bfa 40%, #06b6d4)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                אלגוריתמים א׳
              </span>
              <span className="block mt-3 text-foreground/60 font-semibold"
                style={{ fontSize: 'clamp(1.4rem, 3.5vw, 2.4rem)' }}>
                בלי לאבד שפיות.
              </span>
            </h1>

            <p className="reveal stagger-2 text-xl md:text-2xl text-muted max-w-2xl mx-auto mb-3 leading-relaxed">
              קורס וידאו בעברית, מסודר נושא-אחר-נושא בדיוק כמו בכיתה.
            </p>
            <p className="reveal stagger-2 text-muted/50 text-base mb-14">
              הסברים שמבינים. תרגול שמכין. בלי ניחושים.
            </p>

            {/* CTAs */}
            <div className="reveal stagger-3 flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Link href={FULL_COURSE_HREF}
                className="group relative overflow-hidden bg-primary hover:bg-primary-hover text-white font-bold rounded-2xl px-10 py-4 text-xl w-full sm:w-auto text-center transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_0_55px_rgba(124,58,237,0.65)]">
                <span className="relative z-10">הרשמי לקורס המלא</span>
                <span className="absolute inset-0 bg-gradient-to-l from-violet-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
              <Link href="/login"
                className="border border-border-light text-muted hover:text-foreground hover:border-cyan-500/40 font-medium rounded-2xl px-10 py-4 text-xl w-full sm:w-auto text-center transition-all hover:shadow-[0_0_24px_rgba(6,182,212,0.15)]">
                כבר נרשמת? כניסה
              </Link>
            </div>

            {/* Inline trust signals */}
            <div className="reveal stagger-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-muted/60 text-sm">
              <span className="flex items-center gap-1.5"><span className="text-green-400 font-bold">✓</span> מאות תלמידות עברו את המבחן</span>
              <span className="w-px h-4 bg-border hidden sm:block" />
              <span className="flex items-center gap-1.5"><span className="text-green-400 font-bold">✓</span> הסברים בעברית בלבד</span>
              <span className="w-px h-4 bg-border hidden sm:block" />
              <span className="flex items-center gap-1.5"><span className="text-green-400 font-bold">✓</span> גישה מיידית</span>
            </div>
          </div>
        </section>

        {/* ══ PAIN ════════════════════════════════════════════════════════ */}
        <section id="pain" className="py-28 px-6">
          <div className="max-w-3xl mx-auto">
            <div className="reveal text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4 leading-[1.2]">
                את יושבת על החומר —
                <span className="block mt-2" style={{
                  background: 'linear-gradient(to left, #a78bfa, #f87171)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>
                  ומרגישה סלט אחד גדול.
                </span>
              </h2>
              <p className="text-muted text-lg"> נשמע מוכר? — את לא לבד!.</p>
            </div>

            <div className="space-y-4 mb-12">
              {PAIN_ITEMS.map((item, i) => (
                <div key={i} className={`reveal stagger-${Math.min(i + 1, 4)} flex items-start gap-4 group`}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-sm font-bold transition-transform group-hover:scale-110"
                    style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171' }}>
                    ✗
                  </div>
                  <p className="text-muted text-lg leading-relaxed pt-0.5 group-hover:text-foreground/80 transition-colors">
                    {item}
                  </p>
                </div>
              ))}
            </div>

            {/* Empathy callout */}
            <div className="reveal-scale p-8 rounded-2xl text-center"
              style={{
                background: 'linear-gradient(135deg, rgba(6,182,212,0.07), rgba(124,58,237,0.07))',
                border: '1px solid rgba(6,182,212,0.3)',
              }}>
              <p className="text-2xl font-bold text-foreground mb-2">זה לא שאת &quot;לא מבינה אלגוריתמים&quot;.</p>
              <p className="text-muted text-lg">זה שאף אחד לא הסביר לך בצורה נכונה — עד עכשיו.</p>
            </div>
          </div>
        </section>

        <Divider />

        {/* ══ WHY DIFFERENT ═══════════════════════════════════════════════ */}
        <section id="why" className="py-28 px-6">
          <div className="max-w-5xl mx-auto">
            <SectionLabel label="למה הקורס הזה עובד" />
            <h2 className="reveal text-4xl md:text-5xl font-bold text-center mb-4">
              לא עוד <GradientText>פיצוח לבד.</GradientText>
            </h2>
            <p className="reveal stagger-1 text-center text-muted text-lg mb-16">
              שנות הוראה, אלפי תלמידות — הפכו לקורס אחד מדויק.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {WHY_CARDS.map((card, i) => (
                <div key={card.title}
                  className={`reveal-scale stagger-${i + 1} group relative rounded-2xl p-8 overflow-hidden transition-all duration-300 hover:-translate-y-2`}
                  style={{ background: card.bg, border: `1px solid ${card.border}` }}
                  onMouseMove={handleCardTilt} onMouseLeave={handleCardReset}>
                  <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{ boxShadow: `0 0 50px ${card.glow} inset, 0 0 40px ${card.glow}` }} />
                  <div className="relative z-10 text-4xl mb-5">{card.icon}</div>
                  <h3 className="relative z-10 font-bold text-xl text-foreground mb-3">{card.title}</h3>
                  <p className="relative z-10 text-muted text-[16px] leading-relaxed">{card.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <Divider />

        {/* ══ FEATURES ════════════════════════════════════════════════════ */}
        <section id="features" className="py-28 px-6">
          <div className="max-w-5xl mx-auto">
            <SectionLabel label="מה כלול בקורס" />
            <h2 className="reveal text-4xl md:text-5xl font-bold text-center mb-4">מה בדיוק תקבלי</h2>
            <p className="reveal stagger-1 text-center text-muted text-lg mb-16">
              הכל במקום אחד, מסודר, נגיש, בלי לחפש
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {FEATURE_CARDS.map((card, i) => (
                <div key={card.title}
                  className={`reveal-scale stagger-${i + 1} group relative rounded-2xl p-8 overflow-hidden cursor-default transition-all duration-300 hover:-translate-y-2`}
                  style={{ background: card.bg, border: `1px solid ${card.border}` }}
                  onMouseMove={handleCardTilt} onMouseLeave={handleCardReset}>
                  <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{ boxShadow: `0 0 50px ${card.glow} inset, 0 0 40px ${card.glow}` }} />
                  <div className="relative z-10 w-14 h-14 rounded-xl flex items-center justify-center text-2xl mb-6"
                    style={{ background: card.iconBg, border: `1px solid ${card.border}`, color: card.iconColor }}>
                    {card.icon}
                  </div>
                  <h3 className="relative z-10 font-bold text-xl text-foreground mb-3">{card.title}</h3>
                  <p className="relative z-10 text-muted text-[16px] leading-relaxed">{card.desc}</p>
                </div>
              ))}
            </div>

            <div className="reveal rounded-2xl px-8 py-5 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-muted"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <span className="flex items-center gap-2"><span style={{ color: '#06b6d4' }}>📱</span> אצלך בבית</span>
              <span className="hidden sm:block w-px h-4 bg-border" />
              <span className="flex items-center gap-2"><span style={{ color: '#06b6d4' }}>⏱</span> בכל שעה, בקצב שלך</span>
              <span className="hidden sm:block w-px h-4 bg-border" />
              <span className="flex items-center gap-2"><span style={{ color: '#06b6d4' }}>♾</span> גישה עד אחרי אלגוריתמים ב׳</span>
            </div>
          </div>
        </section>

        <Divider />

        {/* ══ TESTIMONIALS ════════════════════════════════════════════════ */}
        <section id="testimonials" className="py-28 px-6">
          <div className="max-w-5xl mx-auto">
            <SectionLabel label="מה אומרות התלמידות" />
            <h2 className="reveal text-4xl md:text-5xl font-bold text-center mb-3">
              מאות תלמידות. <GradientText>תוצאות אמיתיות.</GradientText>
            </h2>
            <p className="reveal stagger-1 text-center text-muted text-lg mb-16">
              גם את יכולה להיכנס לבחינה עם ביטחון.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(() => {
                const dynamic = dbTestimonials.map(t => ({
                  letter: t.name.trim().charAt(0),
                  displayName: t.name,
                  city: t.seminary,
                  quote: t.quote,
                }))
                const staticFallback = TESTIMONIALS.map(t => ({
                  letter: t.letter,
                  displayName: t.letter + '׳',
                  city: t.city,
                  quote: t.quote,
                }))
                const all = dynamic.length > 0 ? dynamic : staticFallback
                return all.map((t, i) => (
                  <div key={i}
                    className={`reveal-scale stagger-${(i % 3) + 1} relative rounded-2xl p-8 overflow-hidden`}
                    style={{
                      background: 'linear-gradient(145deg, rgba(124,58,237,0.1), rgba(14,14,38,0.85))',
                      border: '1px solid rgba(124,58,237,0.25)',
                    }}>
                    <div className="absolute top-2 right-5 text-[100px] font-serif leading-none select-none pointer-events-none"
                      style={{ color: 'rgba(124,58,237,0.07)' }}>&ldquo;</div>
                    <div className="relative z-10">
                      <div className="flex gap-0.5 mb-5" aria-label="5 כוכבים">
                        {Array.from({ length: 5 }).map((_, s) => (
                          <svg key={s} className="w-4 h-4" viewBox="0 0 20 20" fill="#fbbf24">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <p className="text-foreground/90 text-[17px] leading-relaxed mb-7">
                        &quot;{t.quote}&quot;
                      </p>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                          style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.4), rgba(6,182,212,0.3))', border: '1px solid rgba(124,58,237,0.4)' }}>
                          {t.letter + '׳'}
                        </div>
                        <div>
                          <p className="text-foreground font-semibold text-sm">{t.displayName}</p>
                          {t.city && <p className="text-muted text-xs mt-0.5">{t.city}</p>}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              })()}
            </div>
          </div>
        </section>

        <Divider />

        {/* ══ TOPICS ══════════════════════════════════════════════════════ */}
        <section id="topics" className="py-28 px-6">
          <div className="max-w-5xl mx-auto">
            <SectionLabel label="תוכן הקורס" />
            <h2 className="reveal text-4xl md:text-5xl font-bold text-center mb-3">כל הנושאים. בסדר הנכון.</h2>
            <p className="reveal stagger-1 text-center text-muted text-lg mb-16">
              בהתאמה מושלמת לתכנית אולטרה קוד— לא פחות, לא יותר.
            </p>

            <div className="reveal-scale mb-6">
              <div className="group relative rounded-2xl p-7 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 overflow-hidden transition-all hover:shadow-[0_0_60px_rgba(124,58,237,0.25)]"
                style={{
                  background: 'linear-gradient(to left, rgba(124,58,237,0.2), rgba(124,58,237,0.1), rgba(6,182,212,0.08))',
                  border: '2px solid rgba(124,58,237,0.4)',
                }}>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl"
                  style={{ background: 'linear-gradient(to left, rgba(124,58,237,0.08), rgba(6,182,212,0.05))' }} />
                <div className="relative z-10">
                  <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#06b6d4' }}>★ המומלץ</div>
                  <h3 className="font-bold text-2xl md:text-3xl text-foreground mb-1">קורס מלא — כל הנושאים</h3>
                  <p className="text-muted">גישה לכל הנושאים, השיעורים וחומרי הלימוד</p>
                </div>
                <Link href={FULL_COURSE_HREF}
                  className="relative z-10 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl px-8 py-4 text-lg whitespace-nowrap shrink-0 transition-all hover:shadow-[0_0_24px_rgba(124,58,237,0.5)] hover:scale-105">
                  {USE_GROW_PAYMENTS ? 'לרכישה' : 'הרשמה'}
                </Link>
              </div>
            </div>

            {topics.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {topics.map((topic, i) => (
                  <div key={topic.id}
                    className={`reveal-scale stagger-${(i % 4) + 1} group relative bg-surface/50 backdrop-blur-sm border border-border/60 rounded-2xl p-5 flex items-center justify-between gap-4 transition-all hover:border-violet-500/30 hover:bg-surface/70 hover:shadow-[0_0_30px_rgba(124,58,237,0.1)] hover:-translate-y-0.5`}>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs text-muted/40 font-mono tabular-nums block mb-0.5">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <h3 className="font-semibold text-foreground group-hover:text-violet-300 transition-colors truncate">
                        {topic.name}
                      </h3>
                      {topic.description && (
                        <p className="text-muted text-xs mt-0.5 line-clamp-1">{topic.description}</p>
                      )}
                      {topic.price > 0 && (
                        <p className="font-bold mt-1.5 text-sm" style={{ color: '#06b6d4' }}>₪{topic.price}</p>
                      )}
                    </div>
                    <Link href={TOPIC_HREF(topic.id)}
                      className="shrink-0 rounded-xl px-4 py-2 text-sm font-medium whitespace-nowrap transition-all hover:scale-105"
                      style={{ border: '1px solid rgba(124,58,237,0.35)', color: '#a78bfa' }}
                      onMouseEnter={e => {
                        const el = e.currentTarget as HTMLAnchorElement
                        el.style.background = '#7c3aed'; el.style.color = '#fff'; el.style.borderColor = '#7c3aed'
                      }}
                      onMouseLeave={e => {
                        const el = e.currentTarget as HTMLAnchorElement
                        el.style.background = ''; el.style.color = '#a78bfa'; el.style.borderColor = 'rgba(124,58,237,0.35)'
                      }}>
                      {USE_GROW_PAYMENTS ? 'רכישה' : 'הרשמה'}
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="reveal text-center">
                <Link href="/register"
                  className="inline-block border border-border-light rounded-2xl px-8 py-4 text-muted hover:border-cyan-500/40 hover:text-cyan-400 transition-all">
                  לבחירת נושאים בדף ההרשמה ←
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* ══ FINAL CTA ═══════════════════════════════════════════════════ */}
        <section id="enroll" className="py-32 px-6">
          <div className="max-w-2xl mx-auto">
            <div className="reveal-scale relative rounded-3xl p-12 md:p-16 text-center overflow-hidden"
              style={{
                background: 'linear-gradient(145deg, rgba(124,58,237,0.18), rgba(14,14,38,0.92), rgba(6,182,212,0.08))',
                border: '1px solid rgba(124,58,237,0.4)',
                boxShadow: '0 0 80px rgba(124,58,237,0.18)',
              }}>
              <div className="aurora-1 absolute -top-20 -right-20 w-56 h-56 rounded-full blur-[80px] pointer-events-none"
                style={{ background: 'rgba(124,58,237,0.28)' }} />
              <div className="aurora-3 absolute -bottom-20 -left-20 w-56 h-56 rounded-full blur-[80px] pointer-events-none"
                style={{ background: 'rgba(6,182,212,0.15)' }} />
              <div className="relative z-10">
                <p className="font-bold text-sm uppercase tracking-widest mb-4" style={{ color: '#06b6d4' }}>
                  המבחן לא מחכה
                </p>
                <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6 leading-[1.2]">
                  את יכולה להיות<br />
                  <GradientText>מוכנה.</GradientText>
                </h2>

                <div className="flex flex-col gap-3 text-right max-w-xs mx-auto mb-10">
                  {[
                    'גישה מיידית — מתחילה ללמוד היום',
                    'קצב שלך — בלי לחץ, בלי מועדים',
                    'מותאם בדיוק לתכנית אולטרה קוד',
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                        style={{ background: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.4)' }}>
                        <span className="text-green-400 text-xs font-bold">✓</span>
                      </div>
                      <span className="text-muted text-[16px]">{item}</span>
                    </div>
                  ))}
                </div>

                <Link href={FULL_COURSE_HREF}
                  className="inline-block bg-primary hover:bg-primary-hover text-white font-bold rounded-2xl px-12 py-5 text-xl transition-all duration-300 hover:scale-[1.04] hover:shadow-[0_0_65px_rgba(124,58,237,0.7)] mb-6">
                  הרשמי עכשיו לקורס המלא
                </Link>

                <p className="text-muted/50 text-sm flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  הרשמה מאובטחת&nbsp;•&nbsp;גישה מיידית לאחר ההרשמה
                </p>
              </div>
            </div>
          </div>
        </section>

      </main>

      <footer className="relative z-10 border-t border-border/40 py-8 text-center text-muted/60 text-sm">
        <p>© {new Date().getFullYear()} אלגוריתמים א׳&nbsp;&nbsp;|&nbsp;&nbsp;גילה לוי</p>
      </footer>
    </div>
  )
}

// ─── Static data ────────────────────────────────────────────────────────────────

const PAIN_ITEMS = [
  'הרשת עמוסה בחומרים אבל חלקם לא מובנים, חלקם לא בתכנית, או לא בסדר שלמדנו',
  'תרגילים ללא פתרון מפורט — רק שאלות, בלי שום כיוון',
  'חברות שלך גם לא ממש מבינות — ולא תמיד יש למי לשאול',
 'הייתה מלחמה, פספסתי שיעורים, עכשיו אין לי מאיפה ללמוד'
]

const WHY_CARDS = [
  {
    icon: '🎯',
    title: 'בדיוק לתכנית',
    desc: 'נושא אחר נושא, בלי חומר מיותר שרק מבלבל ואוכל זמן.',
    bg: 'linear-gradient(135deg, rgba(124,58,237,0.18), rgba(14,14,38,0.6))',
    border: 'rgba(124,58,237,0.28)',
    glow: 'rgba(124,58,237,0.08)',
  },
  {
    icon: '🗣️',
    title: 'עברית ברורה',
    desc: 'לא מינוח אקדמי. לא אנגלית. רק עברית פשוטה וברורה — כי את צריכה להבין, לא לפענח.',
    bg: 'linear-gradient(135deg, rgba(6,182,212,0.14), rgba(14,14,38,0.6))',
    border: 'rgba(6,182,212,0.25)',
    glow: 'rgba(6,182,212,0.07)',
  },
  {
    icon: '✅',
    title: 'מוכח בשטח',
    desc: 'מאות תלמידות שעברו. שנות הוראה שהפכו לשיטה שעובדת — לא תיאוריה, לא ניחושים.',
    bg: 'linear-gradient(135deg, rgba(16,185,129,0.14), rgba(14,14,38,0.6))',
    border: 'rgba(16,185,129,0.25)',
    glow: 'rgba(16,185,129,0.07)',
  },
]

const FEATURE_CARDS = [
  {
    icon: '▶',
    title: 'שיעורי וידאו',
    desc: 'הסברים מוקלטים לכל נושא. עצרי, חזרי, צפי שוב — בקצב שלך, מתי שנוח לך.',
    bg: 'linear-gradient(135deg, rgba(124,58,237,0.18), rgba(14,14,38,0.6))',
    border: 'rgba(124,58,237,0.28)',
    iconBg: 'rgba(124,58,237,0.15)',
    iconColor: '#a78bfa',
    glow: 'rgba(124,58,237,0.08)',
  },
  {
    icon: '✓',
    title: 'שאלות ופתרונות',
    desc: 'תרגול מודרך עם פתרון מלא ומפורט. רואים את הדרך לפתרון — לא רק התשובה.',
    bg: 'linear-gradient(135deg, rgba(16,185,129,0.14), rgba(14,14,38,0.6))',
    border: 'rgba(16,185,129,0.25)',
    iconBg: 'rgba(16,185,129,0.12)',
    iconColor: '#34d399',
    glow: 'rgba(16,185,129,0.07)',
  },
  {
    icon: '◈',
    title: 'חומרי לימוד',
    desc: 'מצגות ודפי תרגול להורדה לכל נושא. תמיד זמינים — גם ברגע לפני הבחינה.',
    bg: 'linear-gradient(135deg, rgba(245,158,11,0.14), rgba(14,14,38,0.6))',
    border: 'rgba(245,158,11,0.25)',
    iconBg: 'rgba(245,158,11,0.12)',
    iconColor: '#fbbf24',
    glow: 'rgba(245,158,11,0.07)',
  },
]

const TESTIMONIALS = [
  {
    letter: 'מ',
    city: 'בני ברק',
    quote: 'הסרטונים פשוט ברורים, לא מידי ארוכים, תמיד אפשר לחזור ולהבין את הנקודה',
  },
  {
    letter: 'ר',
    city: 'בית שמש',
    quote: 'סוף סוף קיבלתי ביטחון. אני ניגשת למבחן החיצוני ברוגע',
  },
  {
    letter: 'ש',
    city: 'ירושלים',
    quote: 'אני בטוחה שמי שנרשמת לקורס הזה לא תתחרט! הסברים ברורים! חומר מסודר! פשוט מושלם',
  },
]

// ─── Sub-components ─────────────────────────────────────────────────────────────

function Divider() {
  return (
    <div className="h-px mx-12 md:mx-32"
      style={{ background: 'linear-gradient(to left, transparent, rgba(124,58,237,0.4), rgba(6,182,212,0.3), transparent)' }}
    />
  )
}

function SectionLabel({ label }: { label: string }) {
  return (
    <div className="reveal flex items-center gap-3 mb-6">
      <div className="h-px flex-1" style={{ background: 'linear-gradient(to right, transparent, rgba(124,58,237,0.4))' }} />
      <span className="text-sm font-bold uppercase tracking-widest whitespace-nowrap" style={{ color: '#06b6d4' }}>
        {label}
      </span>
      <div className="h-px flex-1" style={{ background: 'linear-gradient(to left, transparent, rgba(124,58,237,0.4))' }} />
    </div>
  )
}

function GradientText({ children }: { children: React.ReactNode }) {
  return (
    <span style={{
      background: 'linear-gradient(to left, #a78bfa, #06b6d4)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
    }}>
      {children}
    </span>
  )
}

function handleCardTilt(e: React.MouseEvent<HTMLDivElement>) {
  const el = e.currentTarget
  const rect = el.getBoundingClientRect()
  const x = (e.clientX - rect.left) / rect.width - 0.5
  const y = (e.clientY - rect.top) / rect.height - 0.5
  el.style.transform = `perspective(900px) rotateY(${x * 7}deg) rotateX(${-y * 7}deg) translateY(-8px)`
}

function handleCardReset(e: React.MouseEvent<HTMLDivElement>) {
  e.currentTarget.style.transform = ''
}
