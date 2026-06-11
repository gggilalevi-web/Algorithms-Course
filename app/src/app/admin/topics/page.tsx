import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import DeleteButton from '@/components/ui/DeleteButton'
import type { Topic } from '@/lib/types'

async function deleteTopic(id: string) {
  'use server'
  const admin = createAdminClient()
  await admin.from('topics').delete().eq('id', id)
  revalidatePath('/admin/topics')
}

export default async function TopicsPage() {
  const admin = createAdminClient()
  const { data: topics } = await admin
    .from('topics')
    .select('*, lessons(count), pdfs(count)')
    .order('order_index')

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">ניהול נושאים</h1>
        <Link
          href="/admin/topics/new"
          className="bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl px-5 py-2.5 text-sm"
        >
          + נושא חדש
        </Link>
      </div>

      {!topics || topics.length === 0 ? (
        <div className="bg-surface border border-border rounded-2xl p-10 text-center">
          <p className="text-muted mb-4">עדיין אין נושאים</p>
          <Link href="/admin/topics/new" className="text-primary hover:underline">
            הוסיפי את הנושא הראשון ←
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {(topics as (Topic & { lessons: { count: number }[]; pdfs: { count: number }[] })[]).map((topic) => (
            <div key={topic.id} className="bg-surface border border-border rounded-2xl p-5 flex items-center gap-4">
              <div className="text-muted text-sm w-6 text-center shrink-0">{topic.order_index}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <h2 className="font-semibold text-foreground">{topic.name}</h2>
                  {topic.price > 0 && (
                    <span className="text-xs bg-primary/20 text-accent rounded-full px-2 py-0.5">₪{topic.price}</span>
                  )}
                </div>
                {topic.description && (
                  <p className="text-muted text-sm mt-0.5 truncate">{topic.description}</p>
                )}
                <div className="flex items-center gap-3 mt-1 text-xs text-muted">
                  <span>{topic.lessons?.[0]?.count ?? 0} שיעורים</span>
                  <span>·</span>
                  <span>{topic.pdfs?.[0]?.count ?? 0} קבצי PDF</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href={`/admin/topics/${topic.id}`}
                  className="border border-border text-foreground hover:border-primary hover:text-primary rounded-lg px-3 py-1.5 text-sm"
                >
                  עריכה
                </Link>
                <DeleteButton
                  action={deleteTopic.bind(null, topic.id)}
                  label="מחיקה"
                  confirmMessage={`למחוק את הנושא "${topic.name}"? הפעולה תמחק גם את כל השיעורים והקבצים.`}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
