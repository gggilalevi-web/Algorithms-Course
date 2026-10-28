'use client'

import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import s from '../wig-studio.module.css'
import { DEMO, type Channel } from '../content'
import { ChannelPaths } from './icons'
import { cx, prefersReducedMotion } from './cx'

type Lists = { inIds: string[]; outIds: string[] }
type Device = { on: Channel | null; ring: boolean; shake: boolean }

const ROWS = DEMO.rows
const byId = (id: string) => ROWS.find(r => r.id === id)!
const firstName = (ch: Channel) => ROWS.find(r => r.ch === ch)!.name
const now = () => new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })

// Hero demo board: three customers, three channels. Same timings as the reference script.
export default function HeroDemo() {
  const [lists, setLists] = useState<Lists>({ inIds: ROWS.map(r => r.id), outIds: [] })
  const [chips, setChips] = useState<Record<string, 'wait' | 'done'>>({})
  const [hintId, setHintId] = useState<string | null>(null)
  const [tipOn, setTipOn] = useState(false)
  const [tried, setTried] = useState(false)
  const [device, setDevice] = useState<Device>({ on: null, ring: false, shake: false })
  const [phoneTitle, setPhoneTitle] = useState(DEMO.phone.idle)
  const [phoneMsg, setPhoneMsg] = useState(DEMO.phone.msg(firstName('call')))
  const [waMsg, setWaMsg] = useState(DEMO.wa.msg(firstName('wa')))
  const [waTime, setWaTime] = useState(DEMO.wa.time)
  const [mailName, setMailName] = useState(firstName('mail'))
  const [bar, setBar] = useState<{ ch: Channel | null; icon: Channel; text: string }>(
    { ch: null, icon: 'call', text: DEMO.channels.call.bar(firstName('call')) })
  const [ringing, setRinging] = useState(false)
  const [live, setLive] = useState('')

  const boardRef = useRef<HTMLDivElement>(null)
  const rowEls = useRef(new Map<string, HTMLDivElement>())
  const listsRef = useRef(lists)
  const busy = useRef(false)
  const auto = useRef(true)
  const timers = useRef(new Set<number>())

  const later = (fn: () => void, ms: number) => {
    const t = window.setTimeout(() => { timers.current.delete(t); fn() }, ms)
    timers.current.add(t)
  }

  const showDev = (ch: Channel, name: string) => {
    if (ch === 'call') { setPhoneMsg(DEMO.phone.msg(name)); setPhoneTitle(DEMO.phone.incoming); setDevice({ on: 'call', ring: true, shake: true }) }
    if (ch === 'wa') { setWaMsg(DEMO.wa.msg(name)); setWaTime(now()); setDevice({ on: 'wa', ring: false, shake: false }) }
    if (ch === 'mail') { setMailName(name); setDevice({ on: 'mail', ring: false, shake: false }) }
    setBar({ ch, icon: ch, text: DEMO.channels[ch].bar(name) })
    setRinging(true)
  }

  const markReady = (id: string, done?: () => void) => {
    if (busy.current) return
    busy.current = true
    const { name, ch } = byId(id)
    const reduce = prefersReducedMotion()
    const first = rowEls.current.get(id)?.getBoundingClientRect()
    const next = { inIds: listsRef.current.inIds.filter(x => x !== id), outIds: [id, ...listsRef.current.outIds] }
    listsRef.current = next
    // commit synchronously so the FLIP measurement sees the row in its new column
    flushSync(() => {
      setLists(next)
      setChips(c => ({ ...c, [id]: 'wait' }))
      setHintId(h => (h === id ? null : h))
      setTipOn(false)
    })
    const row = rowEls.current.get(id)
    if (!reduce && first && row) {
      const last = row.getBoundingClientRect()
      row.animate(
        [{ transform: `translate(${first.left - last.left}px,${first.top - last.top}px)` }, { transform: 'none' }],
        { duration: 650, easing: 'cubic-bezier(.2,.7,.2,1)' })
    }
    later(() => { showDev(ch, name); setLive(DEMO.channels[ch].bar(name) + DEMO.liveSuffix) }, reduce ? 0 : 500)
    later(() => { setChips(c => ({ ...c, [id]: 'done' })); setDevice(d => ({ ...d, shake: false })) }, ch === 'call' ? 2300 : 1500)
    later(() => {
      setDevice({ on: null, ring: false, shake: false })
      setRinging(false)
      setPhoneTitle(DEMO.phone.idle)
      busy.current = false
      done?.()
    }, ch === 'call' ? 3500 : 3100)
  }

  const resetDemo = () => {
    const next = { inIds: [...listsRef.current.inIds, ...[...listsRef.current.outIds].reverse()], outIds: [] }
    listsRef.current = next
    setLists(next)
  }

  const invite = () => {
    const first = listsRef.current.inIds[0]
    if (first) { setHintId(first); setTipOn(true); setTried(true) }
  }

  const runAuto = () => {
    const first = listsRef.current.inIds[0]
    if (first) return markReady(first, () => later(runAuto, prefersReducedMotion() ? 200 : 450))
    later(() => { resetDemo(); auto.current = false; invite() }, 1400)
  }

  const onMark = (id: string) => {
    if (busy.current || auto.current) return
    markReady(id, () => {
      if (!listsRef.current.inIds.length) later(() => { resetDemo(); invite() }, 1800)
      else invite()
    })
  }

  const startAuto = useEffectEvent(() => later(runAuto, prefersReducedMotion() ? 300 : 1000))

  // one orchestrated moment: when the board is on screen, run all three customers once
  useEffect(() => {
    const pending = timers.current
    const obs = new IntersectionObserver((ents) => {
      if (!ents[0].isIntersecting) return
      obs.disconnect()
      startAuto()
    }, { threshold: 0.45 })
    obs.observe(boardRef.current!)
    return () => { obs.disconnect(); pending.forEach(clearTimeout); pending.clear() }
  }, [])

  // a row remounts when it changes column, so track the live node per id
  const rowRef = (id: string) => (el: HTMLDivElement) => {
    const map = rowEls.current
    map.set(id, el)
    return () => { if (map.get(id) === el) map.delete(id) }
  }

  const renderRow = (id: string, done: boolean) => {
    const r = byId(id)
    return (
      <div key={id} ref={rowRef(id)} className={cx(s.row, hintId === id && s.hint)} data-name={r.name} data-ch={r.ch}>
        <div className={s.who}><div className={s.nm}>{r.full}</div><div className={s.ds}>{r.desc}</div></div>
        {done
          ? <span className={cx(s.chip, chips[id] === 'wait' && s.wait)}>{chips[id] === 'wait' ? DEMO.channels[r.ch].wait : DEMO.channels[r.ch].done}</span>
          : <button type="button" onClick={() => onMark(id)}>{DEMO.markReady}</button>}
      </div>
    )
  }

  return (
    <div className={cx(s.stage, ringing && s.ringing)} id="stage">
      <div className={cx(s.tip, tipOn && s.on)} id="tip" aria-hidden={!tipOn}><span>{DEMO.tip}</span><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14" /><path d="M6 13l6 6 6-6" /></svg></div>
      <div className={s.board} role="group" aria-label={DEMO.boardLabel} ref={boardRef}>
        <div className={s['board-h']}><b>{DEMO.title}</b><small id="bhint">{tried ? DEMO.hintTry : DEMO.hint}</small></div>
        <div className={s.cols}>
          <div className={s.col} id="colIn">
            <h3>{DEMO.colIn} <span className={s.n} id="nIn">{lists.inIds.length}</span></h3>
            {lists.inIds.map(id => renderRow(id, false))}
          </div>
          <div className={cx(s.col, s.ready)} id="colOut">
            <h3>{DEMO.colOut} <span className={s.n} id="nOut">{lists.outIds.length + 1}</span></h3>
            {lists.outIds.map(id => renderRow(id, true))}
            <div className={s.row}><div className={s.who}><div className={s.nm}>{DEMO.readyRow.full}</div><div className={s.ds}>{DEMO.readyRow.desc}</div></div><span className={s.chip}>{DEMO.readyRow.chip}</span></div>
          </div>
        </div>
      </div>
      <div className={cx(s.phone, s.dev, device.on === 'call' && s.on, device.ring && s.ring, device.shake && s.shake)} aria-hidden="true">
        <div className={s.body}>
          <div className={s.spk}></div>
          <div className={s.scr}>
            <div className={s.t} id="phT">{phoneTitle}</div>
            <div className={s.msg} id="phM">{phoneMsg}</div>
            <div className={s.wave}><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
          </div>
          <div className={s.keys}><i className={s.g}></i><i></i><i className={s.r}></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
        </div>
      </div>
      <div className={cx(s.smart, s.dev, device.on === 'wa' && s.on)} id="smart" aria-hidden="true"><div className={s.sb}><div className={s.sc}>
        <div className={s.wh}><span className={s.av}>{DEMO.wa.avatar}</span><span>{DEMO.wa.studio}</span></div>
        <div className={s.wc}><div className={s.bub} id="waT">{waMsg}<small>{waTime} <b>{DEMO.wa.ticks}</b></small></div></div>
      </div></div></div>
      <div className={cx(s.mailcard, s.dev, device.on === 'mail' && s.on)} id="mailc" aria-hidden="true">
        <div className={s.mtop}><span>{DEMO.mail.from}</span><span>{DEMO.mail.when}</span></div>
        <div className={s.mh}><span className={s.ml}>{DEMO.mail.logo}</span></div>
        <div className={s.mb}><b>{DEMO.mail.title}</b><p>{DEMO.mail.hi} <span id="mlN">{mailName}</span>{DEMO.mail.body}</p>
          <div className={s.mbox}><small>{DEMO.mail.boxLabel}</small><ul>{DEMO.mail.items.map(it => <li key={it}>{it}</li>)}</ul></div>
          <p className={s.sig}>{DEMO.mail.sign}</p></div>
      </div>
      <div className={s.callbar} aria-hidden="true" id="cbar" data-ch={bar.ch ?? undefined}><svg id="cbI" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><ChannelPaths ch={bar.icon} /></svg><span id="cbT">{bar.text}</span></div>
      <p className={s.sr} aria-live="polite" id="live">{live}</p>
    </div>
  )
}
