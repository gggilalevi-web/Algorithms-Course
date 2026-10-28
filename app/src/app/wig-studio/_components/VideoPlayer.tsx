'use client'

import { useEffect, useRef, useState } from 'react'
import s from '../wig-studio.module.css'
import { VIDEO, YOUTUBE_ID } from '../content'

const YT_ORIGIN = 'https://www.youtube-nocookie.com'

// Poster first; the youtube-nocookie iframe is created only after a click.
//
// Captions: `cc_load_policy=0` does not turn YouTube's automatic captions off (only
// `=1`, forcing them on, has an effect), and auto-generated tracks can't be deleted in
// Studio. So once the player is up we tell it, through the IFrame API's postMessage
// protocol, to unload its captions module. The module loads when playback starts and can
// reload when the viewer seeks, so we repeat the command for the first seconds and again
// whenever the player reports an API change.
export default function VideoPlayer() {
  const [playing, setPlaying] = useState(false)
  const [soon, setSoon] = useState(false)
  const frameRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    if (!playing) return
    const send = (payload: object) => frameRef.current?.contentWindow?.postMessage(JSON.stringify(payload), YT_ORIGIN)
    const hideCaptions = () => {
      send({ event: 'listening', id: 'wig-studio-video', channel: 'widget' })
      send({ event: 'command', func: 'unloadModule', args: ['captions'] })
      send({ event: 'command', func: 'unloadModule', args: ['cc'] })
      send({ event: 'command', func: 'setOption', args: ['captions', 'track', {}] })
    }
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== YT_ORIGIN || e.source !== frameRef.current?.contentWindow) return
      let data: { event?: string; info?: { playerState?: number } } | null = null
      try { data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data } catch { return }
      if (data?.event === 'onApiChange' || data?.event === 'onReady' || data?.info?.playerState === 1) hideCaptions()
    }
    addEventListener('message', onMessage)
    const started = Date.now()
    const iv = window.setInterval(() => {
      hideCaptions()
      if (Date.now() - started > 20000) window.clearInterval(iv)
    }, 500)
    return () => { removeEventListener('message', onMessage); window.clearInterval(iv) }
  }, [playing])

  const play = () => {
    if (!YOUTUBE_ID) { setSoon(true); return }
    setPlaying(true)
  }

  return (
    <>
      <div className={s.frame}>
        <div className={s.player} id="player">
          {playing
            ? <iframe
                ref={frameRef}
                src={`${YT_ORIGIN}/embed/${YOUTUBE_ID}?autoplay=1&rel=0&modestbranding=1&playsinline=1&cc_load_policy=0&iv_load_policy=3&enablejsapi=1&origin=${encodeURIComponent(typeof window === 'undefined' ? '' : location.origin)}`}
                allow="autoplay; encrypted-media; fullscreen; picture-in-picture" allowFullScreen title={VIDEO.iframeTitle}></iframe>
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
