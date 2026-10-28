export const cx = (...names: (string | false | null | undefined)[]) => names.filter(Boolean).join(' ')

export const prefersReducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches
