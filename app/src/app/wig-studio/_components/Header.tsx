'use client'

import { useEffect, useState } from 'react'
import s from '../wig-studio.module.css'
import { HEADER } from '../content'
import { cx } from './cx'

export default function Header() {
  const [solid, setSolid] = useState(false)

  useEffect(() => {
    const onScroll = () => setSolid(scrollY > 30)
    addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={cx(s.top, solid && s.solid)} id="top">
      <div className={s.wrap}>
        <a className={s.mark} href="#">
          <span className={s.ring} aria-hidden="true">{HEADER.ring}</span>
          <span>{HEADER.name}</span>
        </a>
        <nav aria-label={HEADER.navLabel}>
          {HEADER.links.map(l => <a key={l.href} className={s.l} href={l.href}>{l.label}</a>)}
          <a className={cx(s.btn, s['btn-brass'])} href="#contact">{HEADER.cta}</a>
        </nav>
      </div>
    </header>
  )
}
