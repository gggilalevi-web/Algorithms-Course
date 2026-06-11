import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'

export default async function AdminDashboard() {
  const admin = createAdminClient()

  const [
    { count: topicsCount },
    { count: lessonsCount },
    { count: studentsCount },
    { count: enrollmentsCount },
  ] = await Promise.all([
    admin.from('topics').select('*', { count: 'exact', head: true }),
    admin.from('lessons').select('*', { count: 'exact', head: true }),
    admin.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
    admin.from('enrollments').select('*', { count: 'exact', head: true }),
  ])

  const stats = [
    { label: 'נושאים', value: topicsCount ?? 0, href: '/admin/topics' },
    { label: 'שיעורים', value: lessonsCount ?? 0, href: '/admin/topics' },
    { label: 'תלמידות', value: studentsCount ?? 0, href: '/admin/students' },
    { label: 'הרשמות', value: enrollmentsCount ?? 0, href: '/admin/students' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold mb-8">לוח ניהול</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="bg-surface border border-border rounded-2xl p-6 hover:border-primary group"
          >
            <p className="text-3xl font-bold text-foreground group-hover:text-primary">{s.value}</p>
            <p className="text-muted text-sm mt-1">{s.label}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/admin/topics/new"
          className="bg-primary hover:bg-primary-hover text-white rounded-2xl p-6 font-semibold text-lg"
        >
          + הוספת נושא חדש
        </Link>
        <Link
          href="/admin/students"
          className="bg-surface border border-border hover:border-primary rounded-2xl p-6 font-semibold text-lg text-foreground"
        >
          ניהול תלמידות →
        </Link>
      </div>
    </div>
  )
}
