import s from '../course-platform.module.css'
import { cx } from './cx'

// The Autostrada logo as its two layers: the wordmark and the lime line.
// The wordmark is white; on light backgrounds pass `ink` to turn it charcoal.
export default function Logo({ className, alt, ink = false }: { className?: string; alt: string; ink?: boolean }) {
  return (
    <span className={cx(s.logo, ink && s.logoInk, className)} role="img" aria-label={alt}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/course-platform/logo-text.webp" alt="" width={748} height={244} className={s.logoText} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/course-platform/logo-line.webp" alt="" width={748} height={244} className={s.logoLine} />
    </span>
  )
}
