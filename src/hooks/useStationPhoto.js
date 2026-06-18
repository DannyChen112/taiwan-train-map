import { useState, useEffect } from 'react'

export function useStationPhoto(wikiUrl, nameEn) {
  const [photo, setPhoto] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!wikiUrl) return
    const title = decodeURIComponent(wikiUrl.split('/wiki/')[1] || '')
    if (!title) return

    let cancelled = false
    setPhoto(null)
    setLoading(true)

    async function load() {
      try {
        // zh Wikipedia REST summary API — higher thumbnail coverage than pageimages action API
        const r1 = await fetch(`https://zh.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`)
        const d1 = await r1.json()
        if (d1?.thumbnail?.source) {
          if (!cancelled) setPhoto(d1.thumbnail.source)
          return
        }
        // Fallback: English Wikipedia using station's English name
        if (nameEn) {
          const r2 = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(nameEn + ' Station')}`)
          const d2 = await r2.json()
          if (d2?.thumbnail?.source && !cancelled) setPhoto(d2.thumbnail.source)
        }
      } catch {}
    }

    load().finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [wikiUrl, nameEn])

  return { photo, loading }
}
