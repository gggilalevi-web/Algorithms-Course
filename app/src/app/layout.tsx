import type { Metadata } from 'next'
import { Rubik } from 'next/font/google'
import './globals.css'

const rubik = Rubik({
  subsets: ['hebrew', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-rubik',
})

export const metadata: Metadata = {
  title: 'אלגוריתמים א׳ | גילה לוי - אוטוסטרדה',
  description: 'קורס אלגוריתמים א׳ לתלמידות הניגשות למבחני אולטרה קוד — גילה לוי, אוטוסטרדה',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="he" dir="rtl" className={`${rubik.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-background font-[var(--font-rubik)]">
        <div className="flex-1 flex flex-col">
          {children}
        </div>
        <footer className="relative z-10 border-t border-white/5 py-4 px-6 text-center"
          style={{ background: 'rgba(10,10,25,0.6)', backdropFilter: 'blur(8px)' }}>
          <p className="text-xs text-muted/50">
            נבנה על ידי{' '}
            <span style={{ background: 'linear-gradient(to left, #a78bfa, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              אוטוסטרדה
            </span>
            {' · '}
            <a href="mailto:gggilalevi@gmail.com"
              className="hover:text-muted/80 transition-colors"
              style={{ WebkitTextFillColor: 'unset' }}>
              gggilalevi@gmail.com
            </a>
          </p>
        </footer>
      </body>
    </html>
  )
}
