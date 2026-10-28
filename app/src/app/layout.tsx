import type { Metadata } from 'next'
import { Rubik } from 'next/font/google'
import './globals.css'
import SiteFooter from '@/components/SiteFooter'

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
        <SiteFooter />
      </body>
    </html>
  )
}
