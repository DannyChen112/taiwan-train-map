import { useState, useEffect } from 'react'

export function useStationPhoto(wikiUrl) {
  const [photo, setPhoto] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!wikiUrl) return
    const title = decodeURIComponent(wikiUrl.split('/wiki/')[1] || '')
    if (!title) return

    setPhoto(null)
    setLoading(true)
    const url = `https://zh.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=pageimages&format=json&pithumbsize=600&origin=*`

    fetch(url)
      .then(r => r.json())
      .then(data => {
        const page = Object.values(data.query.pages)[0]
        if (page?.thumbnail?.source) setPhoto(page.thumbnail.source)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [wikiUrl])

  return { photo, loading }
}
