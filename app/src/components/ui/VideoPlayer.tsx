'use client'

import { getVideoEmbedUrl } from '@/lib/video'

interface VideoPlayerProps {
  url: string
  title?: string
}

export default function VideoPlayer({ url, title }: VideoPlayerProps) {
  const embedUrl = getVideoEmbedUrl(url)

  if (!embedUrl) {
    return (
      <div className="bg-gray-100 rounded-lg p-8 text-center text-gray-500">
        קישור וידאו לא תקין
      </div>
    )
  }

  return (
    <div className="video-container rounded-xl overflow-hidden shadow-lg">
      <iframe
        src={embedUrl}
        title={title ?? 'וידאו'}
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
        frameBorder="0"
      />
    </div>
  )
}
