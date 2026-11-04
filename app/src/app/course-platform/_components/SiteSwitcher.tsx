'use client'

import { useState, type CSSProperties } from 'react'
import s from '../course-platform.module.css'
import { HERO, SAMPLE_SITES, SITE_UI } from '../content'
import { cx } from './cx'

// Hero visual: one course site, re-dressed for three different (fictional) businesses.
export default function SiteSwitcher() {
  const [i, setI] = useState(0)
  const site = SAMPLE_SITES[i]

  return (
    <div className={s.switcher}>
      <div className={s.tabs} role="tablist" aria-label={HERO.switcherLabel}>
        {SAMPLE_SITES.map((x, n) => (
          <button
            key={x.tab}
            type="button"
            role="tab"
            id={`site-tab-${n}`}
            aria-selected={n === i}
            aria-controls="site-panel"
            className={cx(s.tab, n === i && s.tabOn)}
            onClick={() => setI(n)}
          >
            {x.tab}
          </button>
        ))}
      </div>

      <div
        className={s.browser}
        id="site-panel"
        role="tabpanel"
        aria-labelledby={`site-tab-${i}`}
        style={{ '--acc': site.accent, '--acc-soft': site.soft } as CSSProperties}
      >
        <div className={s.bar} aria-hidden="true">
          <i></i><i></i><i></i>
          <span className={s.url} dir="ltr">{HERO.domain}</span>
        </div>
        <div className={s.siteBody} key={site.tab}>
          <div className={s.siteTop}>
            <span className={s.siteMark} aria-hidden="true">{site.name.slice(0, 1)}</span>
            <b>{site.name}</b>
            <span className={s.siteNav}>{SITE_UI.myCourses}</span>
          </div>
          <div className={s.siteHero}>
            <h3>{site.course}</h3>
            <div className={s.meter} aria-label={`${SITE_UI.progress} ${site.progress}%`}>
              <span style={{ inlineSize: `${site.progress}%` }}></span>
            </div>
            <small>{SITE_UI.progress} {site.progress}%</small>
          </div>
          <ol className={s.lessons}>
            {site.lessons.map((l, n) => (
              <li key={l} className={n < Math.round((site.progress / 100) * site.lessons.length) ? s.done : undefined}>
                <span>{SITE_UI.lesson} {n + 1}</span>{l}
              </li>
            ))}
          </ol>
          <span className={s.siteBtn}>{SITE_UI.continue}</span>
        </div>
      </div>
      <p className={s.switchNote}>{HERO.switcherNote}</p>
    </div>
  )
}
