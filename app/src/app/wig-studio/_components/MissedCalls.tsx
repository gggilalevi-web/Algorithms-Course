'use client'

import { useEffect, useRef, useState } from 'react'
import s from '../wig-studio.module.css'
import { PAIN } from '../content'
import { PHONE_PATH } from './icons'
import { prefersReducedMotion } from './cx'

const CALLS = PAIN.calls

// Missed-calls log: fills once when in view; counter is 3 + calls shown so far.
export default function MissedCalls() {
  const [items, setItems] = useState<{ key: number; idx: number }[]>([])
  const [count, setCount] = useState(0)
  const callsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let ci = 0
    let iv: number | undefined
    const addCall = () => {
      const idx = ci % CALLS.length
      ci++
      const key = ci
      setItems(prev => [{ key, idx }, ...prev].slice(0, 8))
      setCount(3 + ci)
    }
    const obs = new IntersectionObserver((ents) => {
      if (!ents[0].isIntersecting) return
      obs.disconnect()
      if (prefersReducedMotion()) { for (let i = 0; i < 6; i++) addCall(); return }
      let k = 0
      iv = window.setInterval(() => { addCall(); if (++k >= CALLS.length) clearInterval(iv) }, 520)
    }, { threshold: 0.35 })
    obs.observe(callsRef.current!)
    return () => { obs.disconnect(); clearInterval(iv) }
  }, [])

  return (
    <div className={s.log} aria-hidden="true">
      <div className={s['log-h']}><b>{PAIN.logTitle}</b><div className={s.count} id="count">{count}<small>{PAIN.logUnit}</small></div></div>
      <div className={s.calls} id="calls" ref={callsRef}>
        {items.map(({ key, idx }) => {
          const [n, t, tm] = CALLS[idx]
          return (
            <div className={s.call} key={key}>
              <span className={s.ic}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#A03232" strokeWidth="2" strokeLinecap="round"><path d={PHONE_PATH} /><path d="M16 3l5 5M21 3l-5 5" /></svg></span>
              <span className={s.tx}><b>{n}</b><span>&quot;{t}&quot;</span></span>
              <time>{tm}</time>
            </div>
          )
        })}
      </div>
    </div>
  )
}
