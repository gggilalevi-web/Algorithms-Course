'use client'

import { useId, useState } from 'react'
import s from '../course-platform.module.css'
import { COST } from '../content'

const shekel = (n: number) => `₪${n.toLocaleString('he-IL')}`

export default function CostMeter() {
  const [monthly, setMonthly] = useState(COST.defaultMonthly)
  const [years, setYears] = useState(COST.defaultYears)
  const mId = useId()
  const yId = useId()
  const months = years * 12
  const total = monthly * months

  return (
    <div className={s.meterBox}>
      <div className={s.sliders}>
        <div className={s.slider}>
          <label htmlFor={mId}>{COST.monthlyLabel}<output htmlFor={mId}>{shekel(monthly)}</output></label>
          <input id={mId} type="range" min={COST.min} max={COST.max} step={COST.step} value={monthly}
            onChange={e => setMonthly(Number(e.target.value))} />
          <div className={s.scale} aria-hidden="true"><span>{shekel(COST.min)}</span><span>{shekel(COST.max)}</span></div>
        </div>
        <div className={s.slider}>
          <label htmlFor={yId}>{COST.yearsLabel}<output htmlFor={yId}>{COST.yearsUnit(years)}</output></label>
          <input id={yId} type="range" min={1} max={5} step={1} value={years}
            onChange={e => setYears(Number(e.target.value))} />
          <div className={s.scale} aria-hidden="true"><span>{COST.yearsUnit(1)}</span><span>{COST.yearsUnit(5)}</span></div>
        </div>
      </div>

      <div className={s.total} aria-live="polite">
        <span className={s.totalLabel}>{COST.totalLabel}</span>
        <span className={s.totalNum} dir="ltr">{shekel(total)}</span>
        <span className={s.totalFormula}>{COST.formula(monthly, months)}</span>
        <p className={s.totalMine}>{COST.mine}</p>
      </div>
    </div>
  )
}
