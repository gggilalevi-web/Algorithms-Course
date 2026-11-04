import type { Metadata } from 'next'
import { Secular_One } from 'next/font/google'
import s from './course-platform.module.css'
import { META, HERO, COMPARE, COST, FEATURES, CASE, HOW, FAQ, CONTACT, FOOTER } from './content'
import Header from './_components/Header'
import SiteSwitcher from './_components/SiteSwitcher'
import CostMeter from './_components/CostMeter'
import LeadForm from './_components/LeadForm'
import MobileCta from './_components/MobileCta'
import Logo from './_components/Logo'
import { cx } from './_components/cx'

// Self-hosted at build time: no runtime request to Google (many visitors browse through a filter).
const secular = Secular_One({ weight: '400', subsets: ['hebrew', 'latin'], variable: '--font-secular' })

export const metadata: Metadata = {
  metadataBase: new URL('https://gilaleviautostrada.com'),
  title: META.title,
  description: META.description,
  alternates: { canonical: '/course-platform' },
  openGraph: {
    type: 'website',
    locale: 'he_IL',
    url: '/course-platform',
    siteName: 'Autostrada',
    title: META.title,
    description: META.description,
  },
}

const Check = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12l5 5 9-10" /></svg>
)

export default function CoursePlatformPage() {
  return (
    <div className={cx(s.page, secular.variable)} lang="he" dir="rtl">
      <Header />

      <main>
        {/* HERO */}
        <section className={cx(s.sec, s.dark, s.hero)} id="cp-hero" aria-labelledby="cp-h1">
          <div className={cx(s.wrap, s.heroGrid)}>
            <div className={s.heroText}>
              <h1 id="cp-h1" className={s.h1}>
                <span>{HERO.h1}</span>
                <span className={s.h1b}>{HERO.h1Line2}</span>
              </h1>
              <p className={s.sub}>{HERO.sub}</p>
              <div className={s.ctas}>
                <a className={cx(s.btn, s.btnLime)} href="#contact">{HERO.ctaPrimary}</a>
                <a className={cx(s.btn, s.btnGhost)} href="#cost">{HERO.ctaSecondary}</a>
              </div>
            </div>
            <SiteSwitcher />
          </div>
          <div className={s.lane} aria-hidden="true"></div>
        </section>

        {/* COMPARE */}
        <section className={cx(s.sec, s.light, s.route)} id="compare" aria-labelledby="cp-compare">
          <div className={s.wrap}>
            <h2 className={s.h2} id="cp-compare">{COMPARE.h2}</h2>
            <p className={s.lead}>{COMPARE.lead}</p>
            <div className={s.table} role="table" aria-label={COMPARE.h2}>
              <div className={cx(s.tr, s.thead)} role="row">
                <span role="columnheader">{COMPARE.colTopic}</span>
                <span role="columnheader">{COMPARE.colReady}</span>
                <span role="columnheader" className={s.mineCol}>{COMPARE.colMine}</span>
              </div>
              {COMPARE.rows.map(r => (
                <div className={s.tr} role="row" key={r.topic}>
                  <b role="rowheader">{r.topic}</b>
                  <span role="cell" data-label={COMPARE.colReady}>{r.ready}</span>
                  <span role="cell" data-label={COMPARE.colMine} className={s.mineCol}>{r.mine}</span>
                </div>
              ))}
            </div>
            <p className={s.honest}>{COMPARE.honest}</p>
          </div>
        </section>

        {/* COST */}
        <section className={cx(s.sec, s.dark, s.route)} id="cost" aria-labelledby="cp-cost">
          <div className={s.wrap}>
            <h2 className={s.h2} id="cp-cost">{COST.h2}</h2>
            <p className={s.lead}>{COST.lead}</p>
            <CostMeter />
            <p className={s.note}>{COST.note}</p>
          </div>
        </section>

        {/* FEATURES */}
        <section className={cx(s.sec, s.light, s.route)} aria-labelledby="cp-features">
          <div className={s.wrap}>
            <h2 className={s.h2} id="cp-features">{FEATURES.h2}</h2>
            <p className={s.lead}>{FEATURES.lead}</p>
            <ul className={s.features}>
              {FEATURES.items.map(f => (
                <li key={f.title}><span className={s.tick}><Check /></span><div><h3>{f.title}</h3><p>{f.text}</p></div></li>
              ))}
            </ul>
          </div>
        </section>

        {/* CASE */}
        <section className={cx(s.sec, s.dark, s.route)} id="case" aria-labelledby="cp-case">
          <div className={cx(s.wrap, s.caseGrid)}>
            <div>
              <h2 className={s.h2} id="cp-case">{CASE.h2}</h2>
              <p className={s.lead}>{CASE.lead}</p>
              <ul className={s.caseList}>
                {CASE.items.map(i => <li key={i}><Check />{i}</li>)}
              </ul>
              <a className={cx(s.btn, s.btnGhost)} href={CASE.link.href}>{CASE.link.label}</a>
            </div>
            <div className={s.pick} aria-hidden="true">
              <b className={s.pickTitle}>{CASE.mock.title}</b>
              <ul>
                {CASE.mock.topics.map((t, n) => (
                  <li key={t} className={(CASE.mock.selected as readonly number[]).includes(n) ? s.pickOn : undefined}>
                    <span className={s.box}><Check /></span>{t}
                  </li>
                ))}
              </ul>
              <div className={s.pickFoot}>
                <span>{CASE.mock.summary(CASE.mock.selected.length)}</span>
                <span className={s.pickPay}>{CASE.mock.pay}</span>
              </div>
            </div>
          </div>
        </section>

        {/* HOW */}
        <section className={cx(s.sec, s.light, s.route)} id="how" aria-labelledby="cp-how">
          <div className={s.wrap}>
            <h2 className={s.h2} id="cp-how">{HOW.h2}</h2>
            <ol className={s.steps}>
              {HOW.steps.map((st, n) => (
                <li key={st.title}><span className={s.stepNo}>{n + 1}</span><div><h3>{st.title}</h3><p>{st.text}</p></div></li>
              ))}
            </ol>
          </div>
        </section>

        {/* FAQ */}
        <section className={cx(s.sec, s.light, s.route, s.faqSec)} id="faq" aria-labelledby="cp-faq">
          <div className={s.wrap}>
            <h2 className={s.h2} id="cp-faq">{FAQ.h2}</h2>
            <div className={s.faq}>
              {FAQ.items.map(f => (
                <details key={f.q}><summary>{f.q}</summary><p>{f.a}</p></details>
              ))}
            </div>
          </div>
        </section>

        {/* CONTACT */}
        <section className={cx(s.sec, s.dark, s.route, s.contact)} id="contact" aria-labelledby="cp-contact">
          <div className={cx(s.wrap, s.contactGrid)}>
            <div>
              <h2 className={s.h2} id="cp-contact">{CONTACT.h2}</h2>
              <p className={s.lead}>{CONTACT.lead}</p>
              <ul className={s.promise}>
                {CONTACT.promise.map(p => <li key={p}><Check />{p}</li>)}
              </ul>
            </div>
            <LeadForm />
          </div>
        </section>
      </main>

      <footer className={s.foot}>
        <div className={s.wrap}>
          <Logo className={s.footLogo} alt={FOOTER.tagline} />
          <p>{FOOTER.line}</p>
          <a href={`mailto:${FOOTER.email}`}>{FOOTER.email}</a>
        </div>
      </footer>

      <MobileCta />
    </div>
  )
}
