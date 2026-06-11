// Extracts the src URL from a pasted <iframe> embed code.
// If the input is already a plain URL, returns it unchanged.
export function extractEmbedSrc(input: string): string {
  const trimmed = input.trim()
  if (!trimmed) return ''
  const match = trimmed.match(/src=["']([^"']+)["']/)
  const raw = match ? match[1] : trimmed
  // Vimeo embed codes use &amp; instead of & in query params — decode it
  return raw.replace(/&amp;/g, '&')
}

export function getVideoEmbedUrl(url: string): string | null {
  if (!url) return null

  // Already a Vimeo embed URL — add clean-player params
  if (url.includes('player.vimeo.com/video/')) {
    try {
      const u = new URL(url)
      u.searchParams.set('title', '0')
      u.searchParams.set('byline', '0')
      u.searchParams.set('portrait', '0')
      u.searchParams.set('dnt', '1')   // removes social buttons (like, watch later, share)
      return u.toString()
    } catch {
      return url
    }
  }

  // YouTube: https://www.youtube.com/watch?v=ID or https://youtu.be/ID
  const ytMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  )
  if (ytMatch) {
    return `https://www.youtube.com/embed/${ytMatch[1]}?rel=0`
  }

  // Vimeo watch URL (legacy, no hash)
  const vimeoMatch = url.match(/(?:vimeo\.com\/)(\d+)/)
  if (vimeoMatch) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}?title=0&byline=0&portrait=0`
  }

  return null
}

export function getVideoProvider(url: string): 'youtube' | 'vimeo' | null {
  if (/youtube\.com|youtu\.be/.test(url)) return 'youtube'
  if (/vimeo\.com/.test(url)) return 'vimeo'
  return null
}
