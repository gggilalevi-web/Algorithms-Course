'use client'

import { useEffect, useState } from 'react'
import s from '../wig-studio.module.css'
import { MOBILE_CTA } from '../content'
import { cx } from './cx'

// Shows after the hero, hides once the form section is on screen.
export default function MobileCta() {
  const [on, setOn] = useState(false)

  useEffect(() => {
    const hero = document.getElementById('h1')!.closest('section')!
    const contact = document.getElementById('contact')!
    const onScroll = () => {
      const pastHero = scrollY > hero.offsetHeight - 200
      const atForm = contact.getBoundingClientRect().top < innerHeight
      setOn(pastHero && !atForm)
    }
    addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => removeEventListener('scroll', onScroll)
  }, [])

  return <div className={cx(s.mcta, on && s.on)} id="mcta"><a className={cx(s.btn, s['btn-brass'])} href="#contact">{MOBILE_CTA}</a></div>
}
