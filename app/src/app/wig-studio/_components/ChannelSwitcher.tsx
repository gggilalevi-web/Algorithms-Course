'use client'

import { useState } from 'react'
import s from '../wig-studio.module.css'
import { FEATURES, type Channel } from '../content'

const P = FEATURES.preview
const WAVE = Array.from({ length: 34 }, (_, i) => 6 + Math.round(20 * Math.abs(Math.sin(i * 1.7))))

function View({ ch }: { ch: Channel }) {
  if (ch === 'mail') return (
    <><div className={s.ph}><span>{P.mail.head[0]}</span><span>{P.mail.head[1]}</span></div><div className={s.mailmini}><div className={s.h}><i></i></div><div className={s.b}><b>{P.mail.title}</b>{P.mail.body}</div></div></>
  )
  if (ch === 'wa') return (
    <><div className={s.ph}><span>{P.wa.head[0]}</span><span>{P.wa.head[1]}</span></div><div className={s.pb}><span className={s.bubble}>{P.wa.body}<small>{P.wa.meta}</small></span></div></>
  )
  return (
    <><div className={s.ph}><span>{P.call.head[0]}</span><span>{P.call.head[1]}</span></div><div className={s.wave2}>{WAVE.map((h, i) => <i key={i} style={{ height: `${h}px` }}></i>)}</div><div className={s.pb}>{P.call.body}</div></>
  )
}

// Channel segmented control (שיחה / מייל / וואטסאפ) and its preview.
export default function ChannelSwitcher() {
  const [ch, setCh] = useState<Channel>('call')
  return (
    <>
      <div className={s.seg} role="group" aria-label={FEATURES.big.segLabel}>
        {FEATURES.big.seg.map(b => (
          <button key={b.ch} type="button" aria-pressed={b.ch === ch} data-ch={b.ch} onClick={() => setCh(b.ch)}>{b.label}</button>
        ))}
      </div>
      <div className={s.preview} id="preview" aria-live="polite"><View ch={ch} /></div>
    </>
  )
}
