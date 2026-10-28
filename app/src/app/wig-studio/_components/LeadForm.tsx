'use client'

import { useRef, useState, type FormEvent } from 'react'
import { flushSync } from 'react-dom'
import s from '../wig-studio.module.css'
import { FORM } from '../content'
import { isValidEmail, isValidPhone, isValidVolume, normalizePhone } from '../lead-rules'
import { cx } from './cx'

type Field = 'name' | 'phone' | 'email' | 'volume'
type Errors = Record<Field, string> | null

export default function LeadForm() {
  const [errors, setErrors] = useState<Errors>(null)
  const [status, setStatus] = useState<'idle' | 'sending' | 'failed' | 'done'>('idle')
  const nameRef = useRef<HTMLInputElement>(null)
  const phoneRef = useRef<HTMLInputElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)
  const volumeRef = useRef<HTMLSelectElement>(null)
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
      volume: isValidVolume(d.volume || '') ? '' : FORM.errVolume,
    }
    setErrors(next)
    const firstBad = (['name', 'phone', 'email', 'volume'] as Field[]).find(k => next[k])
    if (firstBad) { ({ name: nameRef, phone: phoneRef, email: emailRef, volume: volumeRef })[firstBad].current?.focus(); return }

    const src = (new URLSearchParams(location.search).get('src') || 'direct').toLowerCase()
    const source = /^[a-z0-9_-]{1,30}$/.test(src) ? src : 'direct'
    setStatus('sending')
    try {
      const r = await fetch('/api/leads/wig-studio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, phone: normalizePhone(rawPhone), email, city: d.city, volume: d.volume, message: d.message,
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

  const invalid = (key: Field) => (errors ? !!errors[key] : undefined)

  return (
    <form className={s.card} id="form" noValidate onSubmit={onSubmit}>
      <div id="formBody" hidden={status === 'done'}>
        <div className={s.fields}>
          <div className={cx(s.fld, errors?.name && s.bad)} id="f-name"><label htmlFor="name">{FORM.name}</label><input id="name" name="name" autoComplete="name" maxLength={60} aria-describedby="e-name" aria-invalid={invalid('name')} ref={nameRef} /><span className={s.err} id="e-name">{errors?.name}</span></div>
          <div className={cx(s.fld, errors?.phone && s.bad)} id="f-phone"><label htmlFor="phone">{FORM.phone}</label><input id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" dir="ltr" style={{ textAlign: 'end' }} maxLength={22} aria-describedby="e-phone" aria-invalid={invalid('phone')} ref={phoneRef} /><span className={s.err} id="e-phone">{errors?.phone}</span></div>
          <div className={cx(s.fld, errors?.email && s.bad)} id="f-email"><label htmlFor="email">{FORM.email}</label><input id="email" name="email" type="email" inputMode="email" autoComplete="email" dir="ltr" style={{ textAlign: 'end' }} maxLength={120} aria-describedby="e-email" aria-invalid={invalid('email')} ref={emailRef} /><span className={s.err} id="e-email">{errors?.email}</span></div>
          <div className={s.fld}><label htmlFor="city">{FORM.city} <small>{FORM.optional}</small></label><input id="city" name="city" autoComplete="address-level2" maxLength={40} /></div>
          <div className={cx(s.fld, s.full, errors?.volume && s.bad)} id="f-volume"><label htmlFor="volume">{FORM.volume}</label>
            <select id="volume" name="volume" defaultValue="" aria-describedby="e-volume" aria-invalid={invalid('volume')} ref={volumeRef}><option value="" disabled>{FORM.volumePlaceholder}</option>{FORM.volumes.map(v => <option key={v}>{v}</option>)}</select><span className={s.err} id="e-volume">{errors?.volume}</span></div>
          <div className={cx(s.fld, s.full)}><label htmlFor="message">{FORM.message} <small>{FORM.optional}</small></label><textarea id="message" name="message" maxLength={500}></textarea></div>
          <label className={s.consent}><input type="checkbox" name="consent" id="consent" />{FORM.consent}</label>
          <div className={s.hp} aria-hidden="true"><label htmlFor="company">{FORM.honeypot}</label><input id="company" name="company" tabIndex={-1} autoComplete="off" /></div>
        </div>
        <button className={s.btn} type="submit" id="send" disabled={status === 'sending'}>{status === 'sending' ? FORM.sending : FORM.submit}</button>
        <p className={s.ferr} id="ferr" role="alert" hidden={status !== 'failed'}>{FORM.failed}</p>
      </div>
      <div className={s.done} id="done" hidden={status !== 'done'} tabIndex={-1} ref={doneRef}>
        <div className={s.ok}><svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#3B5E45" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5 9-10" /></svg></div>
        <h3>{FORM.doneTitle}</h3>
        <p>{FORM.doneText}</p>
      </div>
    </form>
  )
}
