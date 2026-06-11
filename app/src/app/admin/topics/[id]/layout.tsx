import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'

export default async function TopicEditLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const { id: currentId } = await params
  const admin = createAdminClient()
  const { data: topics } = await admin
    .from('topics')
    .select('id, name, order_index')
    .order('order_index')

  return (
    <div className="flex gap-6 items-start">
      {/* Sidebar */}
      <aside className="w-52 shrink-0 sticky top-24">
        <div className="bg-surface border border-border rounded-2xl overflow-hidden">
          <div className="px-4 py-2.5 border-b border-border flex items-center justify-between">
            <span className="text-xs font-semibold text-muted">נושאים</span>
            <Link href="/admin/topics" className="text-xs text-muted/50 hover:text-muted transition-colors">
              רשימה מלאה
            </Link>
          </div>
          <nav className="py-1 max-h-[70vh] overflow-y-auto">
            {(topics ?? []).map(t => (
              <Link
                key={t.id}
                href={`/admin/topics/${t.id}`}
                className={`flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
                  t.id === currentId
                    ? 'bg-primary/10 text-accent font-semibold border-r-2 border-accent'
                    : 'text-muted hover:text-foreground hover:bg-surface-elevated'
                }`}
              >
                <span className="text-xs text-muted/40 font-mono w-4 shrink-0 text-center">{t.order_index}</span>
                <span className="truncate">{t.name}</span>
              </Link>
            ))}
          </nav>
          <div className="px-3 py-2 border-t border-border">
            <Link
              href="/admin/topics/new"
              className="block text-xs text-accent/60 hover:text-accent transition-colors text-center"
            >
              + נושא חדש
            </Link>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {children}
      </div>
    </div>
  )
}
