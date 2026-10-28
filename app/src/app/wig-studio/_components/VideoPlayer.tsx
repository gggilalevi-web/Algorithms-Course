'use client'

import { useState } from 'react'
import s from '../wig-studio.module.css'
import { VIDEO, YOUTUBE_ID } from '../content'

// Poster first; the youtube-nocookie iframe is created only after a click.
export default function VideoPlayer() {
  const [playing, setPlaying] = useState(false)
  const [soon, setSoon] = useState(false)

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
                src={`https://www.youtube-nocookie.com/embed/${YOUTUBE_ID}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
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
