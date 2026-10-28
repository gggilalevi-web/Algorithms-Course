'use client'

import { useState, type CSSProperties } from 'react'
import s from '../wig-studio.module.css'
import { CUSTOM } from '../content'

// "מותאמת לסטודיו שלך": swatches recolor the mini dashboard through --a / --b / --bg.
export default function StudioColors() {
  const [picked, setPicked] = useState(0)
  const sw = CUSTOM.swatches[picked]
  return (
    <div className={s.wrap}>
      <div>
        <h2 className={s.h2} id="cH">{CUSTOM.h2}</h2>
        <p className={s.lead}>{CUSTOM.lead}</p>
        <div className={s.sw} role="group" aria-label={CUSTOM.swLabel}>
          {CUSTOM.swatches.map((c, i) => (
            <button key={c.a} type="button" aria-pressed={i === picked} aria-label={c.label} style={{ background: c.a }} onClick={() => setPicked(i)}></button>
          ))}
        </div>
        <div className={s.tags}>{CUSTOM.tags.map(t => <span key={t}>{t}</span>)}</div>
      </div>
      <div className={s.mini} id="mini" aria-hidden="true" style={{ '--a': sw.a, '--b': sw.b, '--bg': sw.bg } as CSSProperties}>
        <div className={s.side}><div className={s.lg}>{CUSTOM.mini.logo}</div><i></i><i></i><i></i><i></i></div>
        <div className={s.main}>
          <b>{CUSTOM.mini.greeting}</b>
          {CUSTOM.mini.rows.map(n => <div className={s.r} key={n}><span>{n}</span><em>{CUSTOM.mini.action}</em></div>)}
        </div>
      </div>
    </div>
  )
}
