'use client'

import { useEffect, useState } from 'react'
import s from '../course-platform.module.css'
import { HEADER } from '../content'
import { cx } from './cx'
import Logo from './Logo'

export default function Header() {
  const [solid, setSolid] = useState(false)

  useEffect(() => {
    const onScroll = () => setSolid(scrollY > 30)
    addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={cx(s.top, solid && s.solid)}>
      <div className={s.topIn}>
        <a className={s.brand} href="#">
          <Logo className={s.brandLogo} alt={HEADER.logoAlt} />
        </a>
        <nav className={s.nav} aria-label={HEADER.navLabel}>
          {HEADER.links.map(l => <a key={l.href} className={s.navLink} href={l.href}>{l.label}</a>)}
        </nav>
        <a className={cx(s.btn, s.btnLime, s.topCta)} href="#contact">{HEADER.cta}</a>
      </div>
    </header>
  )
}
