'use client'

import { useEffect, useEffectEvent, useRef, useState } from 'react'
import s from '../wig-studio.module.css'
import { VIDEO, YOUTUBE_ID } from '../content'

const YT_ORIGIN = 'https://www.youtube-nocookie.com'

// The video starts by itself when it scrolls into view. Browsers only allow that
// muted, so it starts silent with a clear "turn the sound on" button; a click on the
// poster (before it scrolls in) still starts it with sound. It pauses when it leaves
// the screen and resumes when it comes back.
//
// Captions: `cc_load_policy=0` does not turn YouTube's automatic captions off, and
// auto-generated tracks can't be deleted in Studio, so once the player is up we tell it,
// through the IFrame API's postMessage protocol, to unload its captions module. The
// module loads when playback starts and can reload on seek, so the command is repeated
// for the first seconds and whenever the player reports an API change.
export default function VideoPlayer() {
  const [mode, setMode] = useState<'poster' | 'muted' | 'sound'>('poster')
  // the iframe URL is fixed when playback first starts, so turning the sound on later
  // talks to the running player instead of reloading it
  const [src, setSrc] = useState<string | null>(null)
  const [soon, setSoon] = useState(false)
  const frameRef = useRef<HTMLIFrameElement>(null)
  const boxRef = useRef<HTMLDivElement>(null)
  const started = src !== null

  const start = (muted: boolean) => {
    setSrc(`${YT_ORIGIN}/embed/${YOUTUBE_ID}?autoplay=1&rel=0&modestbranding=1&playsinline=1&cc_load_policy=0&iv_load_policy=3&enablejsapi=1${muted ? '&mute=1' : ''}&origin=${encodeURIComponent(location.origin)}`)
    setMode(muted ? 'muted' : 'sound')
  }

  const send = (func: string, args: unknown[] = []) =>
    frameRef.current?.contentWindow?.postMessage(JSON.stringify({ event: 'command', func, args }), YT_ORIGIN)

  const startMuted = useEffectEvent(() => { if (src === null) start(true) })

  // start muted once the player is half on screen
  useEffect(() => {
    if (!YOUTUBE_ID || started || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const obs = new IntersectionObserver((ents) => {
      if (!ents[0].isIntersecting) return
      obs.disconnect()
      startMuted()
    }, { threshold: 0.5 })
    obs.observe(boxRef.current!)
    return () => obs.disconnect()
  }, [started])

  // pause off screen, resume on screen
  useEffect(() => {
    if (!started) return
    const obs = new IntersectionObserver((ents) => {
      send(ents[0].isIntersecting ? 'playVideo' : 'pauseVideo')
    }, { threshold: 0.25 })
    obs.observe(boxRef.current!)
    return () => obs.disconnect()
  }, [started])

  // keep captions off
  useEffect(() => {
    if (!started) return
    const post = (payload: object) => frameRef.current?.contentWindow?.postMessage(JSON.stringify(payload), YT_ORIGIN)
    const hideCaptions = () => {
      post({ event: 'listening', id: 'wig-studio-video', channel: 'widget' })
      post({ event: 'command', func: 'unloadModule', args: ['captions'] })
      post({ event: 'command', func: 'unloadModule', args: ['cc'] })
      post({ event: 'command', func: 'setOption', args: ['captions', 'track', {}] })
    }
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== YT_ORIGIN || e.source !== frameRef.current?.contentWindow) return
      let data: { event?: string; info?: { playerState?: number } } | null = null
      try { data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data } catch { return }
      if (data?.event === 'onApiChange' || data?.event === 'onReady' || data?.info?.playerState === 1) hideCaptions()
    }
    addEventListener('message', onMessage)
    const t0 = Date.now()
    const iv = window.setInterval(() => {
      hideCaptions()
      if (Date.now() - t0 > 20000) window.clearInterval(iv)
    }, 500)
    return () => { removeEventListener('message', onMessage); window.clearInterval(iv) }
  }, [started])

  const play = () => {
    if (!YOUTUBE_ID) { setSoon(true); return }
    start(false)
  }

  const unmute = () => {
    send('unMute')
    send('setVolume', [100])
    send('playVideo')
    setMode('sound')
  }

  return (
    <>
      <div className={s.frame}>
        <div className={s.player} id="player" ref={boxRef}>
          {started
            ? <>
                <iframe
                  ref={frameRef}
                  src={src ?? undefined}
                  allow="autoplay; encrypted-media; fullscreen; picture-in-picture" allowFullScreen title={VIDEO.iframeTitle}></iframe>
                {mode === 'muted' && (
                  <button type="button" className={s.unmute} onClick={unmute}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5L6 9H2v6h4l5 4z" /><path d="M15.5 8.5a5 5 0 0 1 0 7" /><path d="M19 5a10 10 0 0 1 0 14" /></svg>
                    {VIDEO.unmute}
                  </button>
                )}
              </>
            : <button className={s.poster} type="button" id="poster" aria-label={VIDEO.posterLabel} onClick={play}>
                <span className={s.pt}><b>{VIDEO.posterTitle}</b><span>{VIDEO.posterSub}</span><span className={s.play} style={{ display: 'grid' }}><svg viewBox="0 0 24 24" fill="#1E0819"><path d="M6 4l14 8-14 8z" /></svg></span></span>
                <span className={s.dur} style={{ zIndex: 1 }}>{VIDEO.duration}</span>
              </button>}
        </div>
      </div>
      <p className={s.vnote} id="vnote" hidden={!soon}>{VIDEO.soon}</p>
      {YOUTUBE_ID && <p className={s.vnote}>{VIDEO.fallback} <a href={`https://www.youtube.com/watch?v=${YOUTUBE_ID}`} target="_blank" rel="noopener">{VIDEO.fallbackLink}</a></p>}
    </>
  )
}
