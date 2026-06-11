'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { extractEmbedSrc } from '@/lib/video'
import type { Topic, Lesson, PDF, Section } from '@/lib/types'

const inputCls = 'w-full bg-surface-elevated border border-border-light text-foreground placeholder:text-muted rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary'

export default function EditTopicPage() {
  const params = useParams()
  const topicId = params.id as string

  const [topic,    setTopic]    = useState<Topic | null>(null)
  const [lessons,  setLessons]  = useState<Lesson[]>([])
  const [pdfs,     setPdfs]     = useState<PDF[]>([])
  const [sections, setSections] = useState<Section[]>([])
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState<string | null>(null)
  const [success,  setSuccess]  = useState<string | null>(null)

  // topic form
  const [form, setForm] = useState({ name: '', description: '', price: '', order_index: '0' })

  // section management
  const [newSectionName,  setNewSectionName]  = useState('')
  const [addingSection,   setAddingSection]   = useState(false)
  const [sectionError,    setSectionError]    = useState<string | null>(null)
  const [collapsedIds,    setCollapsedIds]    = useState<Set<string>>(new Set())

  // drag & drop (ref = no re-render on drag start → drag doesn't abort)
  const draggingRef                           = useRef<{ id: string; fromSection: string | null } | null>(null)
  const [dragOverId,      setDragOverId]      = useState<string | null>(null)  // section id or 'none'

  // inline "add lesson" inside a section
  const [addLessonIn,     setAddLessonIn]     = useState<string | null>(null)  // section id or 'none'
  const [newLesson,       setNewLesson]       = useState({ title: '', type: 'lesson' as 'lesson' | 'qa', video_url: '', order_index: '0', intro_text: '' })
  const [addingLesson,    setAddingLesson]    = useState(false)

  // pdf
  const [newPdf,    setNewPdf]    = useState({ name: '', url: '' })
  const [addingPdf, setAddingPdf] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/admin/topics/${topicId}/data`)
      if (!res.ok) { setLoading(false); return }
      const { topic: t, lessons: l, pdfs: p, sections: s } = await res.json()
      if (t) {
        setTopic(t)
        setForm({ name: t.name, description: t.description ?? '', price: String(t.price), order_index: String(t.order_index) })
      }
      setLessons((l as Lesson[]) ?? [])
      setPdfs((p as PDF[]) ?? [])
      setSections((s as Section[]) ?? [])
      setLoading(false)
    }
    load()
  }, [topicId])

  // ── topic ────────────────────────────────────────────────────────────
  async function saveTopic(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError(null)
    const { error } = await supabase.from('topics').update({
      name: form.name, description: form.description || null,
      price: parseFloat(form.price) || 0, order_index: parseInt(form.order_index) || 0,
    }).eq('id', topicId)
    setSaving(false)
    if (error) { setError('שגיאה בשמירה'); return }
    setSuccess('נשמר ✓'); setTimeout(() => setSuccess(null), 2500)
  }

  // ── sections ─────────────────────────────────────────────────────────
  async function addSection() {
    if (!newSectionName.trim()) { setSectionError('נא להזין שם'); return }
    setSectionError(null); setAddingSection(true)
    try {
      const res = await fetch('/api/admin/sections', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic_id: topicId, name: newSectionName.trim(), order_index: sections.length }),
      })
      const data = await res.json()
      if (!res.ok) { setSectionError(data.error ?? 'שגיאה'); return }
      setSections(prev => [...prev, data as Section])
      setNewSectionName('')
    } catch { setSectionError('שגיאת רשת') }
    finally { setAddingSection(false) }
  }

  async function deleteSection(id: string) {
    if (!confirm('למחוק תת-נושא זה?')) return
    const res = await fetch('/api/admin/sections', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (res.ok) {
      setSections(prev => prev.filter(s => s.id !== id))
      setLessons(prev => prev.map(l => l.section_id === id ? { ...l, section_id: null } : l))
    }
  }

  function toggleCollapse(id: string) {
    setCollapsedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  // ── lessons ──────────────────────────────────────────────────────────
  async function updateLesson(lessonId: string, fields: Partial<Lesson>): Promise<string | null> {
    const res = await fetch('/api/admin/lessons', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: lessonId, ...fields }),
    })
    if (res.ok) {
      setLessons(prev => prev.map(l => l.id === lessonId ? { ...l, ...fields } : l))
      return null
    }
    let errMsg = `שגיאת שרת (${res.status})`
    try {
      const body = await res.json()
      if (body.error) errMsg = body.error
    } catch { /* ignore */ }
    console.error('[updateLesson] failed:', res.status, errMsg)
    return errMsg
  }

  async function deleteLesson(id: string) {
    if (!confirm('למחוק שיעור זה?')) return
    await fetch('/api/admin/lessons', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setLessons(prev => prev.filter(l => l.id !== id))
  }

  async function addLessonToZone(sectionId: string | null) {
    if (!newLesson.title.trim()) return
    setAddingLesson(true)
    const res = await fetch('/api/admin/lessons', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic_id: topicId, section_id: sectionId,
        title: newLesson.title, type: newLesson.type,
        video_url: extractEmbedSrc(newLesson.video_url) || null,
        intro_text: newLesson.intro_text || null,
        order_index: parseInt(newLesson.order_index) || 0,
      }),
    })
    setAddingLesson(false)
    if (!res.ok) { setError('שגיאה בהוספת שיעור'); return }
    const added = await res.json()
    setLessons(prev => [...prev, added as Lesson])
    setNewLesson({ title: '', type: 'lesson', video_url: '', order_index: '0', intro_text: '' })
    setAddLessonIn(null)
  }

  // ── drag & drop ───────────────────────────────────────────────────────
  // Using dataTransfer (not state) to avoid re-render that aborts the drag
  function handleDragStart(e: React.DragEvent, lesson: Lesson) {
    e.dataTransfer.setData('text/plain', lesson.id)
    e.dataTransfer.effectAllowed = 'move'
    draggingRef.current = { id: lesson.id, fromSection: lesson.section_id }
  }

  function handleDragEnter(e: React.DragEvent, targetId: string | null) {
    e.preventDefault()
    const from = draggingRef.current?.fromSection ?? null
    const target = targetId ?? 'none'
    const fromKey = from ?? 'none'
    if (fromKey !== target) setDragOverId(target)
  }

  function handleDragLeave(e: React.DragEvent) {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverId(null)
  }

  async function handleDrop(e: React.DragEvent, targetSectionId: string | null) {
    e.preventDefault()
    setDragOverId(null)
    const lessonId = e.dataTransfer.getData('text/plain')
    if (!lessonId) return
    draggingRef.current = null
    const err = await updateLesson(lessonId, { section_id: targetSectionId })
    if (err) setError(`שגיאה בהזזת שיעור: ${err}`)
  }

  // ── pdf ───────────────────────────────────────────────────────────────
  async function addPdf(e: React.FormEvent) {
    e.preventDefault()
    if (!newPdf.name.trim() || !newPdf.url.trim()) return
    setAddingPdf(true)
    const res = await fetch('/api/admin/pdfs', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic_id: topicId, name: newPdf.name, url: newPdf.url }),
    })
    setAddingPdf(false)
    if (!res.ok) { setError('שגיאה בשמירת הקובץ'); return }
    const pdfRow = await res.json()
    setPdfs(prev => [...prev, pdfRow as PDF])
    setNewPdf({ name: '', url: '' })
  }

  async function deletePdf(pdf: PDF) {
    if (!confirm(`למחוק "${pdf.name}"?`)) return
    await fetch('/api/admin/pdfs', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: pdf.id }),
    })
    setPdfs(prev => prev.filter(p => p.id !== pdf.id))
  }

  // ── render helpers ────────────────────────────────────────────────────
  if (loading) return (
    <div className="flex items-center gap-3 text-muted py-10">
      <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      טוען...
    </div>
  )
  if (!topic) return <div className="text-red-400 py-10">נושא לא נמצא</div>

  const unsectioned = lessons.filter(l => !l.section_id)

  // Renders the body of one section / the "no section" zone
  function renderZoneBody(zoneId: string | null, zoneLessons: Lesson[]) {
    const zoneKey = zoneId ?? 'none'
    const isOver = dragOverId === zoneKey

    return (
      <div
        onDragEnter={e => handleDragEnter(e, zoneId)}
        onDragOver={e => e.preventDefault()}
        onDragLeave={handleDragLeave}
        onDrop={e => handleDrop(e, zoneId)}
        className={`min-h-[40px] rounded-b-xl transition-all duration-150 ${isOver ? 'bg-accent/8 ring-1 ring-accent/40 ring-inset' : ''}`}
      >
        {isOver && (
          <div className="text-xs text-accent text-center py-2 font-semibold animate-pulse">
            ← שחרר כאן
          </div>
        )}

        {zoneLessons.length > 0 && (
          <div className="px-3 py-2 space-y-1.5">
            {zoneLessons.map(l => (
              <div key={l.id} className="flex items-start gap-1.5">
                {/* drag handle */}
                <span
                  draggable
                  onDragStart={e => handleDragStart(e, l)}
                  className="mt-[10px] cursor-grab active:cursor-grabbing text-muted/30 hover:text-muted/60 select-none text-base shrink-0 px-0.5 transition-colors"
                  title="גרור לתת-נושא אחר"
                >
                  ⠿
                </span>
                <div className="flex-1 min-w-0">
                  <LessonRow
                    lesson={l}
                    sections={sections}
                    onDelete={() => deleteLesson(l.id)}
                    onUpdate={updateLesson}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Inline add lesson */}
        <div className="px-3 pb-3">
          {addLessonIn === zoneKey ? (
            <div className="border border-border/60 rounded-xl p-3 space-y-2.5 mt-1.5" style={{ background: 'rgba(0,0,0,0.15)' }}>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-muted mb-1">סוג</label>
                  <select value={newLesson.type} onChange={e => setNewLesson(p => ({ ...p, type: e.target.value as 'lesson' | 'qa' }))} className={inputCls}>
                    <option value="lesson">שיעור</option>
                    <option value="qa">שאלות ופתרונות</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-muted mb-1">סדר</label>
                  <input type="number" min="0" value={newLesson.order_index} onChange={e => setNewLesson(p => ({ ...p, order_index: e.target.value }))} className={inputCls} dir="ltr" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">כותרת *</label>
                <input value={newLesson.title} onChange={e => setNewLesson(p => ({ ...p, title: e.target.value }))} placeholder="כותרת השיעור" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">קוד Embed או קישור וידאו</label>
                <textarea rows={2} value={newLesson.video_url} onChange={e => setNewLesson(p => ({ ...p, video_url: e.target.value }))} placeholder={'<iframe ...> מוימיאו או קישור'} className={`${inputCls} resize-none font-mono text-xs`} dir="ltr" />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">מבוא</label>
                <textarea rows={2} value={newLesson.intro_text} onChange={e => setNewLesson(p => ({ ...p, intro_text: e.target.value }))} className={`${inputCls} resize-none`} />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => addLessonToZone(zoneId)} disabled={addingLesson}
                  className="text-xs bg-primary hover:bg-primary-hover text-white rounded-lg px-3 py-1.5 disabled:opacity-60 font-medium">
                  {addingLesson ? 'מוסיף...' : '+ הוספה'}
                </button>
                <button type="button" onClick={() => setAddLessonIn(null)}
                  className="text-xs text-muted hover:text-foreground rounded-lg px-3 py-1.5 border border-border">
                  ביטול
                </button>
              </div>
            </div>
          ) : (
            <button type="button"
              onClick={() => { setAddLessonIn(zoneKey); setNewLesson({ title: '', type: 'lesson', video_url: '', order_index: String(zoneLessons.length), intro_text: '' }) }}
              className="text-xs text-accent/70 hover:text-accent transition-colors font-medium mt-1.5">
              + הוסף שיעור
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-8">
      <h1 className="text-2xl font-bold text-foreground">{topic.name}</h1>

      {error && <div className="bg-red-500/10 border border-red-500/25 text-red-400 rounded-xl px-4 py-3 text-sm">{error}</div>}
      {success && <div className="bg-success/10 border border-success/25 text-success rounded-xl px-4 py-3 text-sm">{success}</div>}

      {/* ── Topic details ────────────────────────────────────────────── */}
      <section className="bg-surface border border-border rounded-2xl p-6">
        <h2 className="font-bold text-lg text-foreground mb-5">פרטי הנושא</h2>
        <form onSubmit={saveTopic} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">שם</label>
            <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">תיאור</label>
            <textarea rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className={`${inputCls} resize-none`} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">מחיר (₪)</label>
              <input type="number" min="0" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} className={inputCls} dir="ltr" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">סדר</label>
              <input type="number" min="0" value={form.order_index} onChange={e => setForm({ ...form, order_index: e.target.value })} className={inputCls} dir="ltr" />
            </div>
          </div>
          <button type="submit" disabled={saving} className="bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl px-6 py-2.5 text-sm disabled:opacity-60">
            {saving ? 'שומר...' : 'שמירה'}
          </button>
        </form>
      </section>

      {/* ── Lessons + sections ───────────────────────────────────────── */}
      <section className="bg-surface border border-border rounded-2xl p-6">
        <h2 className="font-bold text-lg text-foreground mb-1">שיעורים ותתי-נושאים</h2>
        {sections.length > 0 && (
          <p className="text-xs text-muted mb-5">גרור שיעורים (⠿) בין הקבוצות</p>
        )}

        <div className="space-y-2 mt-4">
          {/* Named sections */}
          {sections.map(s => {
            const sLessons = lessons.filter(l => l.section_id === s.id)
            const collapsed = collapsedIds.has(s.id)
            const isOver = dragOverId === s.id

            return (
              <div key={s.id}
                className={`rounded-xl border overflow-hidden transition-all duration-150 ${isOver ? 'border-accent/60 shadow-[0_0_0_2px_rgba(124,58,237,0.15)]' : 'border-border'}`}
              >
                {/* section header */}
                <div
                  className="flex items-center gap-3 px-4 py-2.5 cursor-pointer select-none"
                  style={{ background: 'rgba(124,58,237,0.06)' }}
                  onClick={() => toggleCollapse(s.id)}
                >
                  <span className={`text-xs text-muted transition-transform duration-200 ${collapsed ? '' : 'rotate-90'}`}>▶</span>
                  <div className="w-2 h-2 rounded-full bg-accent/60 shrink-0" />
                  <span className="flex-1 text-sm font-semibold text-foreground">{s.name}</span>
                  <span className="text-xs text-muted/50">{sLessons.length} שיעורים</span>
                  <button onClick={e => { e.stopPropagation(); deleteSection(s.id) }}
                    className="text-xs text-red-400/60 hover:text-red-400 transition-colors">
                    מחיקה
                  </button>
                </div>

                {!collapsed && renderZoneBody(s.id, sLessons)}
              </div>
            )
          })}

          {/* "No section" zone */}
          <div className={`rounded-xl border overflow-hidden transition-all duration-150 ${dragOverId === 'none' ? 'border-amber-400/50 shadow-[0_0_0_2px_rgba(251,191,36,0.12)]' : 'border-border border-dashed'}`}>
            <div
              className="flex items-center gap-3 px-4 py-2.5 cursor-pointer select-none"
              onClick={() => toggleCollapse('none')}
            >
              <span className={`text-xs text-muted transition-transform duration-200 ${collapsedIds.has('none') ? '' : 'rotate-90'}`}>▶</span>
              <div className="w-2 h-2 rounded-full bg-muted/30 shrink-0" />
              <span className="flex-1 text-sm font-medium text-muted">{sections.length > 0 ? 'ללא תת-נושא' : 'שיעורים'}</span>
              <span className="text-xs text-muted/50">{unsectioned.length}</span>
            </div>
            {!collapsedIds.has('none') && renderZoneBody(null, unsectioned)}
          </div>

          {/* Add section */}
          <div className="pt-2">
            <p className="text-xs text-muted/70 mb-2">הוספת תת-נושא חדש</p>
            <div className="flex gap-2">
              <input
                value={newSectionName}
                onChange={e => setNewSectionName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSection() } }}
                placeholder="שם תת-נושא (למשל: ערימה בינארית)"
                className="flex-1 bg-surface-elevated border border-border-light text-foreground placeholder:text-muted rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button type="button" onClick={addSection} disabled={addingSection}
                className="bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl px-4 py-2.5 text-sm disabled:opacity-60 shrink-0">
                {addingSection ? '...' : '+ הוספה'}
              </button>
            </div>
            {sectionError && <p className="text-xs text-red-400 mt-2">{sectionError}</p>}
          </div>
        </div>
      </section>

      {/* ── PDFs ─────────────────────────────────────────────────────── */}
      <section className="bg-surface border border-border rounded-2xl p-6">
        <h2 className="font-bold text-lg text-foreground mb-5">קבצי PDF (Google Drive)</h2>
        {pdfs.length > 0 && (
          <div className="divide-y divide-border mb-5">
            {pdfs.map(pdf => (
              <div key={pdf.id} className="flex items-center justify-between py-3 gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-amber-400 text-sm shrink-0">◈</span>
                  <span className="text-sm font-medium text-foreground truncate">{pdf.name}</span>
                  <a href={pdf.storage_path} target="_blank" rel="noopener noreferrer" className="text-xs text-accent hover:text-primary shrink-0">
                    ↗ Drive
                  </a>
                </div>
                <button onClick={() => deletePdf(pdf)} className="text-xs text-red-400 hover:text-red-300 transition-colors shrink-0">מחיקה</button>
              </div>
            ))}
          </div>
        )}
        <form onSubmit={addPdf} className="space-y-3">
          <p className="text-sm font-semibold text-foreground">+ הוספת קובץ</p>
          <div>
            <label className="block text-xs text-muted mb-1">שם הקובץ</label>
            <input required value={newPdf.name} onChange={e => setNewPdf({ ...newPdf, name: e.target.value })} placeholder="למשל: תרגול נושא 1" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">קישור Google Drive</label>
            <input required type="url" value={newPdf.url} onChange={e => setNewPdf({ ...newPdf, url: e.target.value })} placeholder="https://drive.google.com/file/d/..." className={inputCls} dir="ltr" />
          </div>
          <button type="submit" disabled={addingPdf} className="bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl px-5 py-2.5 text-sm disabled:opacity-60">
            {addingPdf ? 'שומר...' : '+ הוספה'}
          </button>
        </form>
      </section>
    </div>
  )
}

// ─── LessonRow ────────────────────────────────────────────────────────────────
function LessonRow({
  lesson, sections, onDelete, onUpdate,
}: {
  lesson: Lesson
  sections: Section[]
  onDelete: () => void
  onUpdate: (id: string, fields: Partial<Lesson>) => Promise<string | null>
}) {
  const [editing,      setEditing]      = useState(false)
  const [title,        setTitle]        = useState(lesson.title)
  const [type,         setType]         = useState<'lesson' | 'qa'>(lesson.type as 'lesson' | 'qa')
  const [videoUrl,     setVideoUrl]     = useState(lesson.video_url ?? '')
  const [orderIndex,   setOrderIndex]   = useState(String(lesson.order_index))
  const [introText,    setIntroText]    = useState(lesson.intro_text ?? '')
  const [sectionId,    setSectionId]    = useState(lesson.section_id ?? '')
  const [imagePreview, setImagePreview] = useState<string | null>(lesson.image_url ?? null)
  const [imageFile,    setImageFile]    = useState<File | null>(null)
  const [removeImage,  setRemoveImage]  = useState(false)
  const [uploadingImg, setUploadingImg] = useState(false)
  const [saving,       setSaving]       = useState(false)
  const [saved,        setSaved]        = useState(false)
  const [saveError,    setSaveError]    = useState<string | null>(null)
  const imageRef = useRef<HTMLInputElement>(null)

  // sync when section changes externally (drag-and-drop)
  useEffect(() => { setSectionId(lesson.section_id ?? '') }, [lesson.section_id])

  function reset() {
    setTitle(lesson.title); setType(lesson.type as 'lesson' | 'qa')
    setVideoUrl(lesson.video_url ?? ''); setOrderIndex(String(lesson.order_index))
    setIntroText(lesson.intro_text ?? ''); setSectionId(lesson.section_id ?? '')
    setImagePreview(lesson.image_url ?? null); setImageFile(null); setRemoveImage(false)
    setEditing(false)
  }

  async function save() {
    setSaving(true)
    setSaveError(null)
    let finalImageUrl: string | null = lesson.image_url ?? null
    if (removeImage) {
      finalImageUrl = null
    } else if (imageFile) {
      setUploadingImg(true)
      const fd = new FormData()
      fd.append('file', imageFile); fd.append('lessonId', lesson.id)
      const r = await fetch('/api/admin/upload-image', { method: 'POST', body: fd })
      setUploadingImg(false)
      if (r.ok) finalImageUrl = (await r.json()).url
    }
    const err = await onUpdate(lesson.id, {
      title: title.trim() || lesson.title, type,
      video_url: extractEmbedSrc(videoUrl) || null,
      order_index: parseInt(orderIndex) || 0,
      intro_text: introText.trim() || null,
      image_url: finalImageUrl,
      section_id: sectionId || null,
    })
    setSaving(false)
    if (err === null) {
      setSaved(true)
      setTimeout(() => { setSaved(false); setEditing(false) }, 1200)
    } else {
      setSaveError(err)
    }
  }

  const rowInputCls = 'w-full bg-surface border border-border-light text-foreground placeholder:text-muted rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary'

  return (
    <div className="bg-surface-elevated rounded-xl overflow-hidden border border-border">
      {/* summary row */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        <span className={`text-xs rounded-lg px-2 py-0.5 shrink-0 font-medium ${
          lesson.type === 'lesson' ? 'bg-primary/10 text-accent border border-primary/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
        }`}>{lesson.type === 'lesson' ? 'שיעור' : 'ש&פ'}</span>
        <span className="text-xs text-muted/50 shrink-0 font-mono">{lesson.order_index}</span>
        <span className="flex-1 text-sm font-medium text-foreground truncate">{lesson.title}</span>
        {lesson.video_url && <span className="text-xs text-muted hidden sm:block">{lesson.video_url.includes('youtube') ? 'YT' : 'Vimeo'}</span>}
        {lesson.image_url && lesson.type === 'qa' && <span className="text-xs text-emerald-400/60 hidden sm:block">🖼</span>}
        <button onClick={() => setEditing(!editing)}
          className="text-xs text-muted hover:text-accent shrink-0 border border-border-light hover:border-accent rounded-lg px-2 py-1 transition-colors">
          {editing ? 'סגור' : '✎'}
        </button>
        <button onClick={onDelete} className="text-xs text-red-400/60 hover:text-red-400 shrink-0 transition-colors">מחיקה</button>
      </div>

      {/* edit panel */}
      {editing && (
        <div className="px-4 pb-4 pt-3 border-t border-border bg-background/30 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted mb-1">סוג</label>
              <select value={type} onChange={e => setType(e.target.value as 'lesson' | 'qa')} className={rowInputCls}>
                <option value="lesson">שיעור</option>
                <option value="qa">שאלות ופתרונות</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted mb-1">סדר</label>
              <input type="number" min="0" value={orderIndex} onChange={e => setOrderIndex(e.target.value)} className={rowInputCls} dir="ltr" />
            </div>
          </div>
          {sections.length > 0 && (
            <div>
              <label className="block text-xs text-muted mb-1">תת-נושא</label>
              <select value={sectionId} onChange={e => setSectionId(e.target.value)} className={rowInputCls}>
                <option value="">ללא תת-נושא</option>
                {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="block text-xs text-muted mb-1">כותרת</label>
            <input value={title} onChange={e => setTitle(e.target.value)} className={rowInputCls} />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">
              קוד Embed או קישור וידאו
            </label>
            <textarea
              rows={3}
              value={videoUrl}
              onChange={e => setVideoUrl(e.target.value)}
              className={`${rowInputCls} resize-none font-mono text-xs leading-relaxed`}
              placeholder={'הדבקי קוד <iframe ...> מוימיאו/YouTube\nאו קישור ישיר'}
              dir="ltr"
            />
            <p className="text-[10px] text-muted mt-1">אפשר להדביק את כל קוד ה-iframe — ה-src יחולץ אוטומטית</p>
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">מבוא</label>
            <textarea value={introText} onChange={e => setIntroText(e.target.value)} rows={3} className={`${rowInputCls} resize-none`} />
          </div>
          {type === 'qa' && (
            <div className="border border-border rounded-xl p-3 space-y-2">
              <label className="block text-xs font-medium text-foreground">תמונת השאלה</label>
              {imagePreview && !removeImage ? (
                <div className="space-y-2">
                  <img src={imagePreview} alt="" className="max-h-48 rounded-lg border border-border object-contain bg-surface" />
                  <button type="button" onClick={() => { setRemoveImage(true); setImagePreview(null); setImageFile(null) }} className="text-xs text-red-400/70 hover:text-red-400">הסר תמונה</button>
                </div>
              ) : (
                <div>
                  <input ref={imageRef} type="file" accept="image/*" onChange={e => {
                    const f = e.target.files?.[0]; if (!f) return
                    setImageFile(f); setImagePreview(URL.createObjectURL(f)); setRemoveImage(false)
                  }} className="text-xs text-muted file:me-3 file:bg-surface-elevated file:text-foreground file:border file:border-border file:rounded-lg file:px-3 file:py-1 file:text-xs file:cursor-pointer" />
                  <p className="text-xs text-muted mt-1">JPG, PNG, WEBP</p>
                </div>
              )}
            </div>
          )}
          {saveError && <p className="text-xs text-red-400 bg-red-400/10 rounded-lg px-3 py-1.5">{saveError}</p>}
          <div className="flex gap-2">
            <button onClick={save} disabled={saving || uploadingImg}
              className="text-xs bg-primary hover:bg-primary-hover text-white rounded-lg px-3 py-1.5 disabled:opacity-60 font-medium">
              {uploadingImg ? 'מעלה...' : saving ? 'שומר...' : saved ? '✓ נשמר' : 'שמירה'}
            </button>
            <button onClick={reset} className="text-xs text-muted hover:text-foreground rounded-lg px-3 py-1.5 border border-border">ביטול</button>
          </div>
        </div>
      )}
    </div>
  )
}
