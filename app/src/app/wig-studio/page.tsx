import { Fragment, type CSSProperties } from 'react'
import type { Metadata } from 'next'
import { Assistant, Bellefair } from 'next/font/google'
import s from './wig-studio.module.css'
import {
  META, HERO, PAIN, TURN, VIDEO, FEATURES, VOICES_SECTION, VOICES, CONTACT,
} from './content'
import Header from './_components/Header'
import HeroDemo from './_components/HeroDemo'
import MissedCalls from './_components/MissedCalls'
import VideoPlayer from './_components/VideoPlayer'
import ChannelSwitcher from './_components/ChannelSwitcher'
import StudioColors from './_components/StudioColors'
import LeadForm from './_components/LeadForm'
import MobileCta from './_components/MobileCta'
import { ChannelPaths, Check, PHONE_PATH } from './_components/icons'
import { cx } from './_components/cx'

// Self-hosted at build time: no runtime request to Google (many visitors are on NetFree).
const bellefair = Bellefair({ weight: '400', subsets: ['hebrew', 'latin'], variable: '--font-bellefair' })
const assistant = Assistant({ weight: ['400', '500', '600', '700'], subsets: ['hebrew', 'latin'], variable: '--font-assistant' })

export const metadata: Metadata = {
  metadataBase: new URL('https://gilaleviautostrada.com'),
  title: META.title,
  description: META.description,
  alternates: { canonical: '/wig-studio' },
  openGraph: {
    type: 'website',
    locale: 'he_IL',
    url: '/wig-studio',
    siteName: 'Autostrada',
    title: META.title,
    description: META.description,
    images: [{ url: '/wig-studio/poster.webp', width: 1600, height: 900, alt: VIDEO.posterTitle }],
  },
}

const FEATURE_ICONS = [
  <Fragment key={0}><path d="M4 7h16M4 12h16M4 17h10" /><path d="M17 16l2 2 3-4" /></Fragment>,
  <Fragment key={1}><rect x="3" y="6" width="18" height="13" rx="2" /><path d="M3 10h18M7 15h4" /></Fragment>,
  <Fragment key={2}><path d="M6 9a6 6 0 0 1 12 0c0 5 2 7 2 7H4s2-2 2-7" /><path d="M10 20a2 2 0 0 0 4 0" /></Fragment>,
  <Fragment key={3}><path d="M8 21V11M16 21V11" /><path d="M8 7c0-1.5 1-2.5 1-4 1 1.5 1 2.5 1 4a1 1 0 0 1-2 0zM16 7c0-1.5 1-2.5 1-4 1 1.5 1 2.5 1 4a1 1 0 0 1-2 0z" transform="translate(-1 0)" /></Fragment>,
  <Fragment key={4}><circle cx="12" cy="12" r="9" /><path d="M12 7v6M12 16.5v.5" /></Fragment>,
]

const PAIN_ICONS = [
  <path key={0} d={PHONE_PATH} />,
  <Fragment key={1}><rect x="3" y="12" width="8" height="8" rx="1.5" /><rect x="13" y="12" width="8" height="8" rx="1.5" /><rect x="8" y="4" width="8" height="8" rx="1.5" /></Fragment>,
  <Fragment key={2}><path d="M4 5h12a3 3 0 0 1 3 3v11H7a3 3 0 0 1-3-3z" /><path d="M8 10h7M8 14h5" /></Fragment>,
]

export default function WigStudioPage() {
  return (
    <div className={cx(s.page, bellefair.variable, assistant.variable)} lang="he" dir="rtl">
      <Header />

      <main>
        {/* HERO */}
        <section className={s.hero} aria-labelledby="h1">
          <div className={s.aurora} aria-hidden="true"><i></i><i></i><i></i></div>
          <div className={s.wrap}>
            <ul className={s.toasts} aria-hidden="true">
              {HERO.toasts.map((t, i) => (
                <li key={t.name} style={{ '--i': i } as CSSProperties}>
                  <span className={cx(s['t-ic'], s[`t-${t.ch}`])}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ChannelPaths ch={t.ch} /></svg></span>
                  <span className={s['t-tx']}><b>{t.name}</b><span>{t.what}</span></span>
                  <time>{t.time}</time>
                </li>
              ))}
            </ul>
            <h1 id="h1">
              <span className={s.hl}><span>{HERO.h1}</span></span>
              <span className={cx(s.hl, s.l2)}><span>{HERO.h1Line2}</span></span>
            </h1>
            <div className={s['hero-aside']}>
              <div>
                <p className={s.sub}>{HERO.sub}</p>
                <div className={s.chans} aria-label={HERO.chansLabel}>
                  <span><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E4C88E" strokeWidth="2" strokeLinecap="round"><ChannelPaths ch="call" /></svg>{HERO.chans.call}</span>
                  <span><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E4C88E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ChannelPaths ch="wa" /></svg>{HERO.chans.wa}</span>
                  <span><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E4C88E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ChannelPaths ch="mail" /></svg>{HERO.chans.mail}</span>
                </div>
              </div>
              <div className={s.ctas}>
                <a className={cx(s.btn, s['btn-brass'])} href="#contact">{HERO.ctaPrimary}</a>
                <a className={cx(s.btn, s['btn-ghost'])} href="#video">{HERO.ctaSecondary}</a>
              </div>
            </div>
            <HeroDemo />
          </div>
        </section>

        {/* PAIN */}
        <section className={s.pain} aria-labelledby="painH">
          <div className={s.wrap}>
            <div>
              <h2 className={s.h2} id="painH">{PAIN.h2}</h2>
              <p className={s.lead}>{PAIN.lead}</p>
              <ul>
                {PAIN.items.map((it, i) => (
                  <li key={it.title}><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#6B2D5C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{PAIN_ICONS[i]}</svg><div><b>{it.title}</b><span>{it.text}</span></div></li>
                ))}
              </ul>
            </div>
            <MissedCalls />
          </div>
        </section>

        <div className={s.turn}>
          <p>{TURN.split(' ').map((w, i, all) => (
            <span key={i} className={i >= all.length / 2 ? s.warm : undefined} style={{ '--i': i } as CSSProperties}>{w}{i < all.length - 1 ? ' ' : ''}</span>
          ))}</p>
        </div>

        {/* VIDEO */}
        <section className={s.video} id="video" aria-labelledby="vH">
          <div className={s.wrap}>
            <h2 className={s.h2} id="vH">{VIDEO.h2}</h2>
            <p className={s.lead}>{VIDEO.lead}</p>
            <VideoPlayer />
          </div>
        </section>

        {/* FEATURES */}
        <section className={s.features} aria-labelledby="fH">
          <div className={s.wrap}>
            <div className={s['f-head']}>
              <h2 className={s.h2} id="fH">{FEATURES.h2}</h2>
              <p className={s.lead}>{FEATURES.lead}</p>
            </div>
            <div className={s['f-grid']}>
              <div className={s.big}>
                <h3>{FEATURES.big.h3}</h3>
                <p>{FEATURES.big.p}</p>
                <ChannelSwitcher />
                <div className={s['who-gets']} aria-label={FEATURES.big.whoLabel}>
                  {FEATURES.big.who.map(([n, c]) => <div key={n}><span>{n}</span><em>{c}</em></div>)}
                </div>
              </div>
              <div className={s.list}>
                {FEATURES.list.map((f, i) => (
                  <div className={s.feat} key={f.title}>
                    <div className={s.fi}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#37102D" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{FEATURE_ICONS[i]}</svg></div>
                    <div><h3>{f.title}</h3><p>{f.text}</p>
                      {i === 3 && <div className={s.week} aria-hidden="true">{FEATURES.week.map(w => <span key={w.label} className={w.kind && s[w.kind]}>{w.label}</span>)}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* VOICES: one horizontal row */}
        <section className={s.voices} aria-labelledby="qH">
          <div className={s.wrap}>
            <div className={s['v-head']}>
              <h2 className={s.h2} id="qH">{VOICES_SECTION.h2}</h2>
              <p className={s.lead}>{VOICES_SECTION.lead}</p>
            </div>
            <div className={s['v-row']}>
              {VOICES.filter(v => v.kind === 'whatsapp').map(v => (
                <div className={s.wall} key={v.text}>
                  <div className={cx(s.wb, s.lg)}><div className={s.by}><i></i>{v.by}</div>{v.text}<small>{v.time}</small></div>
                </div>
              ))}
              {VOICES.filter(v => v.kind === 'mail').map(v => (
                <div className={s.mq} key={v.text}><div className={s['mq-h']}><span className={s['mq-av']} aria-hidden="true"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6B2D5C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ChannelPaths ch="mail" /></svg></span></div><p>{v.text}</p></div>
              ))}
            </div>
          </div>
        </section>

        {/* CUSTOM */}
        <section className={s.custom} aria-labelledby="cH">
          <StudioColors />
        </section>

        {/* CONTACT */}
        <section className={s.contact} id="contact" aria-labelledby="ctH">
          <div className={s.wrap}>
            <div>
              <h2 className={s.h2} id="ctH">{CONTACT.h2}</h2>
              <p className={s.lead}>{CONTACT.lead}</p>
              <ul className={s.promise}>
                {CONTACT.promise.map(p => <li key={p}><Check size={22} stroke="#E4C88E" />{p}</li>)}
              </ul>
            </div>
            <LeadForm />
          </div>
        </section>
      </main>


      <MobileCta />
    </div>
  )
}
