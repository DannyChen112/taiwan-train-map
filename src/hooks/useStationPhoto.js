import { useState, useEffect } from 'react'

async function fetchSummary(lang, title) {
  try {
    const r = await fetch(`https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`)
    const d = await r.json()
    if (d.type === 'disambiguation' || d.type === 'no_content' || !d.title) return { photo: null, isDisam: d.type === 'disambiguation' }
    return { photo: d.thumbnail?.source || null, isDisam: false }
  } catch {
    return { photo: null, isDisam: false }
  }
}

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
      // 1. Try zh Wikipedia with original title
      let res = await fetchSummary('zh', title)

      // 2. If disambiguation, try 台鐵XX車站 (common TRA station naming on zh.wiki)
      if (!res.photo && res.isDisam) {
        res = await fetchSummary('zh', '台鐵' + title)
      }

      // 3. Try English Wikipedia — TRA stations often have en.wiki photos
      if (!res.photo && nameEn) {
        for (const suffix of [' Station', ' railway station', ' train station']) {
          res = await fetchSummary('en', nameEn + suffix)
          if (res.photo) break
        }
      }

      if (res.photo && !cancelled) setPhoto(res.photo)
    }

    load().finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [wikiUrl, nameEn])

  return { photo, loading }
}
