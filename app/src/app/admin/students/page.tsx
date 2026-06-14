'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Profile, Topic, Enrollment } from '@/lib/types'

interface StudentWithEnrollments extends Profile {
  enrollments: Enrollment[]
  email: string
  seminary: string
}

const inputCls = 'w-full bg-surface-elevated border border-border text-foreground rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted'

export default function StudentsPage() {
  const [students, setStudents] = useState<StudentWithEnrollments[]>([])
  const [topics, setTopics] = useState<Topic[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [showAddForm, setShowAddForm] = useState(false)
  const [newStudent, setNewStudent] = useState({ email: '', name: '', password: '' })
  const [addingStudent, setAddingStudent] = useState(false)

  const supabase = createClient()

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const [studentsRes, { data: topicsData }] = await Promise.all([
      fetch('/api/admin/students').then(r => r.json()),
      supabase.from('topics').select('*').order('order_index'),
    ])

    setStudents(studentsRes ?? [])
    setTopics((topicsData as Topic[]) ?? [])
    setLoading(false)
  }

  async function addStudent(e: React.FormEvent) {
    e.preventDefault()
    setAddingStudent(true)
    setError(null)

    const res = await fetch('/api/admin/create-student', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newStudent),
    })

    const result = await res.json()
    setAddingStudent(false)

    if (!res.ok) { setError(result.error ?? 'שגיאה בהוספת תלמידה'); return }

    setSuccess('תלמידה נוספה בהצלחה')
    setNewStudent({ email: '', name: '', password: '' })
    setShowAddForm(false)
    setTimeout(() => setSuccess(null), 3000)
    loadData()
  }

  async function toggleEnrollment(studentId: string, topicId: string | null, isFullCourse: boolean) {
    const existing = students
      .find((s) => s.id === studentId)
      ?.enrollments.find((e) => isFullCourse ? e.is_full_course : e.topic_id === topicId)

    if (existing) {
      await fetch('/api/admin/enrollment', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enrollment_id: existing.id }),
      })
    } else {
      await fetch('/api/admin/enrollment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: studentId, topic_id: isFullCourse ? null : topicId, is_full_course: isFullCourse }),
      })
    }
    loadData()
  }

  if (loading) return <div className="text-muted py-10">טוען...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-foreground">ניהול תלמידות</h1>
        <button onClick={() => setShowAddForm(!showAddForm)}
          className="bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl px-5 py-2.5 text-sm">
          + תלמידה חדשה
        </button>
      </div>

      {error && <div className="bg-red-900/30 border border-red-500/40 text-red-300 rounded-lg px-4 py-3 text-sm mb-4">{error}</div>}
      {success && <div className="bg-green-900/30 border border-green-500/40 text-green-300 rounded-lg px-4 py-3 text-sm mb-4">{success}</div>}

      {showAddForm && (
        <form onSubmit={addStudent} className="bg-surface border border-border rounded-2xl p-6 mb-6 space-y-4">
          <h2 className="font-bold text-foreground">הוספת תלמידה</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">שם</label>
              <input required value={newStudent.name} onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                className={inputCls} placeholder="שם מלא" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">אימייל</label>
              <input required type="email" value={newStudent.email} onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                className={inputCls} placeholder="email@example.com" dir="ltr" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">סיסמה זמנית</label>
              <input required type="text" value={newStudent.password} onChange={(e) => setNewStudent({ ...newStudent, password: e.target.value })}
                className={inputCls} placeholder="לפחות 6 תווים" dir="ltr" />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={addingStudent}
              className="bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl px-5 py-2.5 text-sm disabled:opacity-60">
              {addingStudent ? 'מוסיף...' : 'הוספה'}
            </button>
            <button type="button" onClick={() => setShowAddForm(false)}
              className="border border-border text-muted hover:text-foreground rounded-xl px-5 py-2.5 text-sm">
              ביטול
            </button>
          </div>
        </form>
      )}

      {students.length === 0 ? (
        <div className="bg-surface border border-border rounded-2xl p-10 text-center">
          <p className="text-muted">עדיין אין תלמידות רשומות</p>
        </div>
      ) : (
        <div className="space-y-3">
          {students.map((student) => {
            const isFullCourse = student.enrollments.some((e) => e.is_full_course)
            const enrolledTopicIds = new Set(student.enrollments.filter((e) => !e.is_full_course).map((e) => e.topic_id))
            return (
              <div key={student.id} className="bg-surface border border-border rounded-2xl p-5">
                <div className="flex items-center justify-between gap-4 mb-4">
                  <div>
                    <p className="font-semibold text-foreground">{student.name ?? 'ללא שם'}</p>
                    {student.email && <p className="text-xs text-muted" dir="ltr">{student.email}</p>}
                    {student.seminary && <p className="text-xs text-muted/70">{student.seminary}</p>}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    <span className={`text-xs rounded-full px-2.5 py-1 font-medium ${isFullCourse ? 'bg-primary text-white' : 'bg-surface-elevated text-muted'}`}>
                      קורס מלא
                    </span>
                    <button onClick={() => toggleEnrollment(student.id, null, true)}
                      className="text-xs border border-border text-muted rounded-lg px-2.5 py-1 hover:border-primary hover:text-accent">
                      {isFullCourse ? 'הסרה' : 'הענקה'}
                    </button>
                  </div>
                </div>

                {!isFullCourse && topics.length > 0 && (
                  <div>
                    <p className="text-xs text-muted mb-2">גישה לנושאים:</p>
                    <div className="flex flex-wrap gap-2">
                      {topics.map((topic) => {
                        const enrolled = enrolledTopicIds.has(topic.id)
                        return (
                          <button key={topic.id} onClick={() => toggleEnrollment(student.id, topic.id, false)}
                            className={`text-xs rounded-full px-3 py-1 border font-medium transition-colors ${
                              enrolled
                                ? 'bg-green-900/30 border-green-500/40 text-green-300 hover:bg-red-900/30 hover:border-red-500/40 hover:text-red-300'
                                : 'border-border text-muted hover:border-primary hover:text-accent'
                            }`}>
                            {topic.name} {enrolled ? '✓' : '+'}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
