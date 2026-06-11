import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import VideoPlayer from '@/components/ui/VideoPlayer'
import type { Topic, Lesson, PDF, Enrollment, Section } from '@/lib/types'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function TopicPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()
  const [{ data: enrollments }, { data: profile }] = await Promise.all([
    supabase.from('enrollments').select('*').eq('user_id', user.id),
    admin.from('profiles').select('role').eq('id', user.id).single(),
  ])

  const isAdmin = profile?.role === 'admin'
  const isFullCourse = isAdmin || (enrollments?.some((e: Enrollment) => e.is_full_course) ?? false)
  const hasAccess =
    isFullCourse || (enrollments?.some((e: Enrollment) => e.topic_id === id) ?? false)

  if (!hasAccess) redirect('/dashboard')

  const { data: allTopics } = await supabase
    .from('topics')
    .select('*')
    .order('order_index')

  const enrolledTopicIds = new Set(
    enrollments?.filter((e: Enrollment) => !e.is_full_course).map((e: Enrollment) => e.topic_id) ?? []
  )
  const accessibleTopics = (allTopics as Topic[] | null)?.filter(
    (t) => isFullCourse || enrolledTopicIds.has(t.id)
  ) ?? []

  const [{ data: topic }, { data: lessonsData }, { data: pdfs }, { data: sectionsData }] = await Promise.all([
    supabase.from('topics').select('*').eq('id', id).single(),
    supabase.from('lessons').select('*').eq('topic_id', id).order('order_index'),
    supabase.from('pdfs').select('*').eq('topic_id', id),
    admin.from('sections').select('*').eq('topic_id', id).order('order_index'),
  ])

  if (!topic) notFound()

  const allLessons = (lessonsData as Lesson[] | null) ?? []
  const sections = (sectionsData as Section[] | null) ?? []
  const hasSections = sections.length > 0

  // Build section → lessons map
  const lessonsBySection = new Map<string, Lesson[]>()
  const unsectionedLessons: Lesson[] = []

  if (hasSections) {
    sections.forEach(s => lessonsBySection.set(s.id, []))
    allLessons.forEach(l => {
      if (l.section_id && lessonsBySection.has(l.section_id)) {
        lessonsBySection.get(l.section_id)!.push(l)
      } else {
        unsectionedLessons.push(l)
      }
    })
  }

  // Fallback (no sections): split by type
  const regularLessons = !hasSections ? allLessons.filter(l => l.type === 'lesson') : []
  const qaLessons = !hasSections ? allLessons.filter(l => l.type === 'qa') : []

  const totalLessons = allLessons.length

  return (
    <div className="flex h-screen bg-background overflow-hidden">

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside className="w-72 shrink-0 overflow-y-auto flex flex-col border-s border-border/60 relative"
        style={{ background: 'linear-gradient(180deg, rgba(12,10,46,0.98) 0%, rgba(7,7,26,0.98) 100%)' }}>

        {/* Sidebar aurora blob */}
        <div className="absolute top-0 left-0 w-48 h-48 rounded-full blur-[80px] pointer-events-none"
          style={{ background: 'rgba(124,58,237,0.12)' }} aria-hidden="true" />

        <div className="relative px-5 py-5 border-b border-border/40">
          <Link href="/dashboard" className="flex items-center gap-2.5 group mb-0.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-opacity group-hover:opacity-80"
              style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(6,182,212,0.15))', border: '1px solid rgba(124,58,237,0.4)' }}>
              <span className="text-violet-300 font-bold text-sm">א</span>
            </div>
            <div className="leading-snug">
              <span className="font-bold text-sm"
                style={{ background: 'linear-gradient(to left, #a78bfa, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                אלגוריתמים א׳
              </span>
              <p className="text-[10px] text-muted/60">אולטרה קוד · גילה לוי</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {accessibleTopics.map((t) => {
            const isActive = t.id === id
            return (
              <div key={t.id}>
                {isActive ? (
                  <div className="rounded-xl overflow-hidden mb-1"
                    style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(14,14,38,0.6))', border: '1px solid rgba(124,58,237,0.45)', boxShadow: '0 0 20px rgba(124,58,237,0.12)' }}>
                    <div className="flex items-center gap-2 px-3 py-3">
                      <span className="text-accent text-xs font-bold shrink-0">▼</span>
                      <span className="text-sm font-semibold text-white leading-snug">{t.name}</span>
                    </div>
                    <div className="pb-2">
                      {hasSections ? (
                        <>
                          {sections.map(s => {
                            const sLessons = lessonsBySection.get(s.id) ?? []
                            if (sLessons.length === 0) return null
                            return (
                              <div key={s.id}>
                                <div className="px-4 pt-2 pb-0.5">
                                  <span className="text-[10px] text-accent/60 font-bold uppercase tracking-wider">{s.name}</span>
                                </div>
                                {sLessons.map(lesson => (
                                  <a key={lesson.id} href={`#lesson-${lesson.id}`}
                                    className="flex items-start gap-2 px-4 py-1.5 text-sm text-muted hover:text-foreground hover:bg-white/5 transition-colors">
                                    <span className="text-accent/40 shrink-0 mt-0.5">›</span>
                                    <span className="leading-snug">{lesson.title}</span>
                                  </a>
                                ))}
                              </div>
                            )
                          })}
                          {unsectionedLessons.length > 0 && (
                            <div>
                              <div className="px-4 pt-2 pb-0.5">
                                <span className="text-[10px] text-muted/50 font-bold uppercase tracking-wider">שיעורים נוספים</span>
                              </div>
                              {unsectionedLessons.map(lesson => (
                                <a key={lesson.id} href={`#lesson-${lesson.id}`}
                                  className="flex items-start gap-2 px-4 py-1.5 text-sm text-muted hover:text-foreground hover:bg-white/5 transition-colors">
                                  <span className="text-accent/40 shrink-0 mt-0.5">›</span>
                                  <span className="leading-snug">{lesson.title}</span>
                                </a>
                              ))}
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          {regularLessons.length > 0 && qaLessons.length > 0 && (
                            <div className="px-4 pt-1 pb-0.5">
                              <span className="text-[10px] text-accent/60 font-bold uppercase tracking-wider">שיעורים</span>
                            </div>
                          )}
                          {regularLessons.map(lesson => (
                            <a key={lesson.id} href={`#lesson-${lesson.id}`}
                              className="flex items-start gap-2 px-4 py-1.5 text-sm text-muted hover:text-foreground hover:bg-white/5 transition-colors">
                              <span className="text-accent/40 shrink-0 mt-0.5">›</span>
                              <span className="leading-snug">{lesson.title}</span>
                            </a>
                          ))}
                          {qaLessons.length > 0 && (
                            <div className="px-4 pt-2 pb-0.5">
                              <span className="text-[10px] text-emerald-400/60 font-bold uppercase tracking-wider">שאלות ופתרונות</span>
                            </div>
                          )}
                          {qaLessons.map(lesson => (
                            <a key={lesson.id} href={`#lesson-${lesson.id}`}
                              className="flex items-start gap-2 px-4 py-1.5 text-sm text-muted hover:text-foreground hover:bg-white/5 transition-colors">
                              <span className="text-emerald-400/40 shrink-0 mt-0.5">›</span>
                              <span className="leading-snug">{lesson.title}</span>
                            </a>
                          ))}
                        </>
                      )}
                      {pdfs && pdfs.length > 0 && (
                        <>
                          <div className="px-4 pt-2 pb-0.5">
                            <span className="text-[10px] text-amber-400/60 font-bold uppercase tracking-wider">חומרי לימוד</span>
                          </div>
                          <a href="#pdfs"
                            className="flex items-start gap-2 px-4 py-1.5 text-sm text-muted hover:text-foreground hover:bg-white/5 transition-colors">
                            <span className="text-amber-400/40 shrink-0 mt-0.5">›</span>
                            <span>קבצי PDF</span>
                          </a>
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <Link href={`/dashboard/topic/${t.id}`}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-muted/70 hover:text-foreground hover:bg-white/5 transition-all group">
                    <span className="text-muted/25 group-hover:text-accent/60 shrink-0 transition-colors">›</span>
                    <span className="leading-snug">{t.name}</span>
                  </Link>
                )}
              </div>
            )
          })}
        </nav>

        <div className="relative px-5 py-4 border-t border-border/40">
          <Link href="/dashboard" className="text-sm text-muted/60 hover:text-accent transition-colors flex items-center gap-1.5 group">
            <span className="transition-transform duration-200 group-hover:-translate-x-0.5">←</span>
            <span>כל הנושאים</span>
          </Link>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">

        {/* Hero */}
        <div className="relative border-b border-border/60 overflow-hidden"
          style={{ background: 'linear-gradient(to bottom, rgba(124,58,237,0.2), rgba(124,58,237,0.06) 60%, transparent)' }}>
          {/* dot grid */}
          <div className="absolute inset-0 pointer-events-none opacity-30"
            style={{
              backgroundImage: 'radial-gradient(rgba(124,58,237,0.35) 1px, transparent 1px)',
              backgroundSize: '24px 24px',
              maskImage: 'radial-gradient(ellipse 100% 100% at 50% 0%, black 20%, transparent 80%)',
              WebkitMaskImage: 'radial-gradient(ellipse 100% 100% at 50% 0%, black 20%, transparent 80%)',
            }}
          />
          <div className="relative max-w-3xl mx-auto px-8 pt-14 pb-10">
            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 mb-5 text-xs font-bold uppercase tracking-widest"
              style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.25)', color: '#06b6d4' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              נושא
            </div>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-4"
              style={{ background: 'linear-gradient(to left, #e8eaf6, #c4b5fd)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {topic.name}
            </h1>
            {topic.description && (
              <p className="text-muted leading-relaxed text-lg max-w-2xl">{topic.description}</p>
            )}
            <div className="flex items-center gap-5 mt-6 text-sm text-muted/70">
              {hasSections ? (
                <>
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent/60 inline-block" />
                    {sections.length} תתי-נושאים
                  </span>
                  {totalLessons > 0 && (
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent/40 inline-block" />
                      {totalLessons} שיעורים
                    </span>
                  )}
                </>
              ) : (
                <>
                  {regularLessons.length > 0 && (
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent/60 inline-block" />
                      {regularLessons.length} שיעורים
                    </span>
                  )}
                  {qaLessons.length > 0 && (
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/60 inline-block" />
                      {qaLessons.length} שאלות ופתרונות
                    </span>
                  )}
                </>
              )}
              {pdfs && pdfs.length > 0 && (
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400/60 inline-block" />
                  {pdfs.length} קבצים
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <main className="max-w-3xl mx-auto px-8 py-12 space-y-16">

          {/* ── Sections mode ── */}
          {hasSections && (
            <>
              {sections.map(s => {
                const sLessons = lessonsBySection.get(s.id) ?? []
                if (sLessons.length === 0) return null
                return (
                  <section key={s.id}>
                    <SectionDivider label={s.name} color="accent" />
                    <div className="space-y-8">
                      {sLessons.map((lesson, i) => (
                        <LessonCard key={lesson.id} lesson={lesson} index={i} variant={lesson.type} />
                      ))}
                    </div>
                  </section>
                )
              })}
              {unsectionedLessons.length > 0 && (
                <section>
                  <SectionDivider label="שיעורים נוספים" color="accent" />
                  <div className="space-y-8">
                    {unsectionedLessons.map((lesson, i) => (
                      <LessonCard key={lesson.id} lesson={lesson} index={i} variant={lesson.type} />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}

          {/* ── Flat mode (no sections) ── */}
          {!hasSections && regularLessons.length > 0 && (
            <section>
              <SectionDivider label="שיעורים" color="accent" />
              <div className="space-y-8">
                {regularLessons.map((lesson, i) => (
                  <LessonCard key={lesson.id} lesson={lesson} index={i} variant="lesson" />
                ))}
              </div>
            </section>
          )}
          {!hasSections && qaLessons.length > 0 && (
            <section>
              <SectionDivider label="שאלות ופתרונות" color="emerald" />
              <div className="space-y-8">
                {qaLessons.map((lesson, i) => (
                  <LessonCard key={lesson.id} lesson={lesson} index={i} variant="qa" />
                ))}
              </div>
            </section>
          )}

          {/* PDFs */}
          {pdfs && pdfs.length > 0 && (
            <section id="pdfs">
              <SectionDivider label="חומרי לימוד" color="amber" />
              <div className="rounded-2xl overflow-hidden border border-border" style={{ background: 'rgba(255,255,255,0.02)' }}>
                {(pdfs as PDF[]).map((pdf, i) => (
                  <PDFDownloadRow key={pdf.id} pdf={pdf} isLast={i === pdfs.length - 1} />
                ))}
              </div>
            </section>
          )}

          {totalLessons === 0 && (!pdfs || pdfs.length === 0) && (
            <div className="py-24 text-center">
              <div className="text-5xl mb-5">🚀</div>
              <p className="text-muted text-lg">אנחנו עובדים על זה... חזרי בקרוב!</p>
            </div>
          )}

          <div className="h-16" />
        </main>
      </div>
    </div>
  )
}

function SectionDivider({ label, color }: { label: string; color: 'accent' | 'emerald' | 'amber' }) {
  const colors = {
    accent:  { text: 'text-accent',       line: 'rgba(124,58,237,0.35)' },
    emerald: { text: 'text-emerald-400',  line: 'rgba(52,211,153,0.3)'  },
    amber:   { text: 'text-amber-400',    line: 'rgba(251,191,36,0.3)'  },
  }
  const c = colors[color]
  return (
    <div className="flex items-center gap-4 mb-10">
      <div className="h-px flex-1" style={{ background: `linear-gradient(to left, ${c.line}, transparent)` }} />
      <span className={`text-sm font-bold uppercase tracking-widest ${c.text}`}>{label}</span>
      <div className="h-px flex-1" style={{ background: `linear-gradient(to right, ${c.line}, transparent)` }} />
    </div>
  )
}

function LessonCard({ lesson, index, variant }: { lesson: Lesson; index: number; variant: 'lesson' | 'qa' }) {
  const isQA = variant === 'qa'
  const badgeBg    = isQA ? 'rgba(52,211,153,0.18)'  : 'rgba(124,58,237,0.18)'
  const badgeBorder= isQA ? 'rgba(52,211,153,0.45)'  : 'rgba(124,58,237,0.45)'
  const badgeColor = isQA ? '#34d399'                : '#a78bfa'
  const cardBg     = isQA
    ? 'linear-gradient(to bottom, rgba(52,211,153,0.06), rgba(7,7,26,0.5))'
    : 'linear-gradient(to bottom, rgba(124,58,237,0.08), rgba(7,7,26,0.5))'
  const cardBorder = isQA ? 'rgba(52,211,153,0.25)'  : 'rgba(124,58,237,0.28)'
  const topBarBg   = isQA
    ? 'linear-gradient(to left, rgba(52,211,153,0.12), rgba(14,14,38,0.6))'
    : 'linear-gradient(to left, rgba(124,58,237,0.15), rgba(14,14,38,0.6))'

  return (
    <div
      id={`lesson-${lesson.id}`}
      className="rounded-2xl scroll-mt-6 overflow-hidden"
      style={{ border: `1px solid ${cardBorder}`, background: cardBg, boxShadow: `0 4px 24px -4px ${badgeBg}` }}
    >
      <div className="flex items-center gap-4 px-7 py-5 border-b" style={{ borderColor: cardBorder, background: topBarBg }}>
        <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 text-base font-bold"
          style={{ background: badgeBg, border: `1px solid ${badgeBorder}`, color: badgeColor }}>
          {index + 1}
        </div>
        <h2 className="text-2xl font-bold text-foreground leading-snug">{lesson.title}</h2>
      </div>

      <div className="px-7 py-6 space-y-5">
        {lesson.intro_text && (
          <div className="border-r-4 pr-5 py-1.5 rounded-l-lg text-foreground/75 leading-relaxed text-base whitespace-pre-wrap"
            style={{ borderColor: badgeBorder, background: `${badgeBg}` }}>
            {lesson.intro_text}
          </div>
        )}

        {lesson.image_url && (
          <img
            src={lesson.image_url}
            alt={lesson.title}
            className="rounded-xl border border-border max-w-full object-contain"
            style={{ background: 'rgba(255,255,255,0.03)' }}
          />
        )}

        {lesson.video_url ? (
          <VideoPlayer url={lesson.video_url} title={lesson.title} />
        ) : !lesson.image_url ? (
          <div className="py-10 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-muted">הסרטון יעלה בקרוב ✦</p>
          </div>
        ) : null}
      </div>
    </div>
  )
}

function toDriveEmbed(url: string): string {
  return url
    .replace(/\/view(\?.*)?$/, '/preview')
    .replace(/\/edit(\?.*)?$/, '/preview')
    .replace(/[?&]usp=[^&]+/g, '')
}

function PDFDownloadRow({ pdf, isLast }: { pdf: PDF; isLast: boolean }) {
  const isDrive = pdf.storage_path.startsWith('https://')
  const embedUrl = isDrive ? toDriveEmbed(pdf.storage_path) : null

  return (
    <div className={!isLast ? 'border-b border-border' : ''}>
      <div className="flex items-center justify-between px-6 py-4 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center shrink-0">
            <span className="text-amber-400 text-sm">◈</span>
          </div>
          <span className="font-medium text-foreground text-sm">{pdf.name}</span>
        </div>
        {isDrive && (
          <a
            href={pdf.storage_path}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold text-accent hover:text-primary border border-border-light hover:border-accent rounded-lg px-3 py-1.5 transition-all shrink-0"
          >
            פתיחה ב-Drive ↗
          </a>
        )}
      </div>

      {embedUrl && (
        <div className="px-6 pb-5">
          <iframe
            src={embedUrl}
            className="w-full rounded-xl border border-border"
            style={{ height: '500px' }}
            allow="autoplay"
            title={pdf.name}
          />
        </div>
      )}
    </div>
  )
}
