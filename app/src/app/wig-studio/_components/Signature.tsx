'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import s from '../wig-studio.module.css'
import { cx } from './cx'

// Footer band: adds `run` once it is 45% in view, which starts the CSS rays/glow/logo reveal.
export default function Signature({ children }: { children: ReactNode }) {
  const [run, setRun] = useState(false)
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const obs = new IntersectionObserver((ents) => {
      if (!ents[0].isIntersecting) return
      obs.disconnect()
      setRun(true)
    }, { threshold: 0.45 })
    obs.observe(ref.current!)
    return () => obs.disconnect()
  }, [])

  return <footer className={cx(s.sig, run && s.run)} id="sig" ref={ref}>{children}</footer>
}
