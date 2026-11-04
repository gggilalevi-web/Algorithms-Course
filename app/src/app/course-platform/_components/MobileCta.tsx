'use client'

import { useEffect, useState } from 'react'
import s from '../course-platform.module.css'
import { MOBILE_CTA } from '../content'
import { cx } from './cx'

// Shows after the hero, hides once the form section is on screen.
export default function MobileCta() {
  const [on, setOn] = useState(false)

  useEffect(() => {
    const hero = document.getElementById('cp-hero')
    const contact = document.getElementById('contact')
    if (!hero || !contact) return
    const onScroll = () => {
      const pastHero = scrollY > hero.offsetHeight - 200
      const atForm = contact.getBoundingClientRect().top < innerHeight
      setOn(pastHero && !atForm)
    }
    addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className={cx(s.mcta, on && s.mctaOn)} aria-hidden={!on}>
      <a className={cx(s.btn, s.btnLime)} href="#contact" tabIndex={on ? 0 : -1}>{MOBILE_CTA}</a>
    </div>
  )
}
