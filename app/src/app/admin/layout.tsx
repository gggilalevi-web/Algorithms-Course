import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('role, name')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/dashboard')

  async function handleSignOut() {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-surface/90 backdrop-blur-sm border-b border-border sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
                <span className="text-accent text-xs font-bold">א</span>
              </div>
              <span className="font-bold text-foreground text-sm">ניהול | אלגוריתמים א׳</span>
            </div>
            <nav className="flex items-center gap-1 text-sm">
              <Link href="/admin" className="text-muted hover:text-foreground hover:bg-surface-elevated px-3 py-1.5 rounded-lg transition-all">
                ראשי
              </Link>
              <Link href="/admin/topics" className="text-muted hover:text-foreground hover:bg-surface-elevated px-3 py-1.5 rounded-lg transition-all">
                נושאים
              </Link>
              <Link href="/admin/students" className="text-muted hover:text-foreground hover:bg-surface-elevated px-3 py-1.5 rounded-lg transition-all">
                תלמידות
              </Link>
              <Link href="/admin/testimonials" className="text-muted hover:text-foreground hover:bg-surface-elevated px-3 py-1.5 rounded-lg transition-all">
                תגובות
              </Link>
              <Link href="/admin/settings" className="text-muted hover:text-foreground hover:bg-surface-elevated px-3 py-1.5 rounded-lg transition-all">
                הגדרות
              </Link>
              <Link href="/dashboard" className="text-muted hover:text-accent px-3 py-1.5 rounded-lg transition-all">
                לאזור הסטודנטית ↗
              </Link>
            </nav>
          </div>
          <form action={handleSignOut}>
            <button type="submit" className="text-sm text-muted hover:text-foreground transition-colors">
              יציאה
            </button>
          </form>
        </div>
      </header>
      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-10">
        {children}
      </main>
    </div>
  )
}
