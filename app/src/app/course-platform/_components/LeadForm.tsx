'use client'

import { useRef, useState, type FormEvent } from 'react'
import { flushSync } from 'react-dom'
import s from '../course-platform.module.css'
import { FORM } from '../content'
import { isValidEmail, isValidPhone, isValidStage, normalizePhone } from '../lead-rules'
import { cx } from './cx'

type Field = 'name' | 'phone' | 'email' | 'stage'
type Errors = Record<Field, string> | null

export default function LeadForm() {
  const [errors, setErrors] = useState<Errors>(null)
  const [status, setStatus] = useState<'idle' | 'sending' | 'failed' | 'done'>('idle')
  const nameRef = useRef<HTMLInputElement>(null)
  const phoneRef = useRef<HTMLInputElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)
  const stageRef = useRef<HTMLSelectElement>(null)
  const doneRef = useRef<HTMLDivElement>(null)

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const d = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string | undefined>
    const name = (d.name || '').trim()
    const rawPhone = d.phone || ''
    const email = (d.email || '').trim()
    const next: Record<Field, string> = {
      name: name.length < 2 ? FORM.errName : '',
      phone: isValidPhone(rawPhone) ? '' : FORM.errPhone,
      email: isValidEmail(email) ? '' : FORM.errEmail,
      stage: isValidStage(d.stage || '') ? '' : FORM.errStage,
    }
    setErrors(next)
    const firstBad = (['name', 'phone', 'email', 'stage'] as Field[]).find(k => next[k])
    if (firstBad) { ({ name: nameRef, phone: phoneRef, email: emailRef, stage: stageRef })[firstBad].current?.focus(); return }

    const src = (new URLSearchParams(location.search).get('src') || 'direct').toLowerCase()
    const source = /^[a-z0-9_-]{1,30}$/.test(src) ? src : 'direct'
    setStatus('sending')
    try {
      const r = await fetch('/api/leads/course-platform', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, phone: normalizePhone(rawPhone), email, stage: d.stage, message: d.message,
          consent: !!d.consent, company: d.company, source,
        }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok || !j.ok) throw new Error('lead not accepted')
      flushSync(() => setStatus('done'))
      doneRef.current?.focus()
    } catch {
      setStatus('failed')
    }
  }

  const bad = (k: Field) => !!errors?.[k]

  return (
    <form className={s.form} noValidate onSubmit={onSubmit}>
      <div hidden={status === 'done'}>
        <div className={s.fields}>
          <div className={cx(s.fld, bad('name') && s.bad)}>
            <label htmlFor="cp-name">{FORM.name}</label>
            <input id="cp-name" name="name" autoComplete="name" maxLength={60} aria-describedby="cp-e-name" aria-invalid={bad('name') || undefined} ref={nameRef} />
            <span className={s.err} id="cp-e-name">{errors?.name}</span>
          </div>
          <div className={cx(s.fld, bad('phone') && s.bad)}>
            <label htmlFor="cp-phone">{FORM.phone}</label>
            <input id="cp-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" dir="ltr" maxLength={22} aria-describedby="cp-e-phone" aria-invalid={bad('phone') || undefined} ref={phoneRef} />
            <span className={s.err} id="cp-e-phone">{errors?.phone}</span>
          </div>
          <div className={cx(s.fld, s.full, bad('email') && s.bad)}>
            <label htmlFor="cp-email">{FORM.email}</label>
            <input id="cp-email" name="email" type="email" inputMode="email" autoComplete="email" dir="ltr" maxLength={120} aria-describedby="cp-e-email" aria-invalid={bad('email') || undefined} ref={emailRef} />
            <span className={s.err} id="cp-e-email">{errors?.email}</span>
          </div>
          <div className={cx(s.fld, s.full, bad('stage') && s.bad)}>
            <label htmlFor="cp-stage">{FORM.stage}</label>
            <select id="cp-stage" name="stage" defaultValue="" aria-describedby="cp-e-stage" aria-invalid={bad('stage') || undefined} ref={stageRef}>
              <option value="" disabled>{FORM.stagePlaceholder}</option>
              {FORM.stages.map(v => <option key={v}>{v}</option>)}
            </select>
            <span className={s.err} id="cp-e-stage">{errors?.stage}</span>
          </div>
          <div className={cx(s.fld, s.full)}>
            <label htmlFor="cp-message">{FORM.message} <small>{FORM.optional}</small></label>
            <textarea id="cp-message" name="message" maxLength={500} rows={3}></textarea>
          </div>
          <label className={s.consent}><input type="checkbox" name="consent" />{FORM.consent}</label>
          <div className={s.hp} aria-hidden="true">
            <label htmlFor="cp-company">{FORM.honeypot}</label>
            <input id="cp-company" name="company" tabIndex={-1} autoComplete="off" />
          </div>
        </div>
        <button className={cx(s.btn, s.btnLime, s.submit)} type="submit" disabled={status === 'sending'}>
          {status === 'sending' ? FORM.sending : FORM.submit}
        </button>
        <p className={s.ferr} role="alert" hidden={status !== 'failed'}>{FORM.failed}</p>
      </div>
      <div className={s.doneBox} hidden={status !== 'done'} tabIndex={-1} ref={doneRef}>
        <span className={s.ok} aria-hidden="true">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#1A1D23" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5 9-10" /></svg>
        </span>
        <h3>{FORM.doneTitle}</h3>
        <p>{FORM.doneText}</p>
      </div>
    </form>
  )
}
