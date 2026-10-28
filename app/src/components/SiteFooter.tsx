'use client'

import { usePathname } from 'next/navigation'

// Global footer. Hidden on /wig-studio, which renders its own footer.
export default function SiteFooter() {
  const pathname = usePathname()
  if (pathname?.startsWith('/wig-studio')) return null

  return (
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
  )
}
