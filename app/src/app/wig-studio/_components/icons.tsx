import type { Channel } from '../content'

// SVG paths shared by several icons in the reference.
export const PHONE_PATH = 'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2'

export function ChannelPaths({ ch }: { ch: Channel }) {
  if (ch === 'wa') return <path d="M4 20l1.3-4A8 8 0 1 1 8 18.7z" />
  if (ch === 'mail') return <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></>
  return <path d={PHONE_PATH} />
}

export function Check({ size, stroke, width = 2 }: { size: number; stroke: string; width?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12l5 5 9-10" />
    </svg>
  )
}
