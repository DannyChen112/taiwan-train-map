import { useState, useEffect } from 'react'

function dist(lat1, lng1, lat2, lng2) {
  const R = 6371000
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)))
}

function category(tags) {
  const { tourism, historic, leisure, amenity } = tags
  if (tourism === 'museum')         return { label: '博物館', icon: '🏛️' }
  if (tourism === 'viewpoint')      return { label: '觀景點', icon: '🌄' }
  if (tourism === 'gallery')        return { label: '藝廊',   icon: '🖼️' }
  if (tourism)                      return { label: '景點',   icon: '📍' }
  if (historic)                     return { label: '古蹟',   icon: '🏯' }
  if (leisure === 'nature_reserve') return { label: '自然區', icon: '🌿' }
  if (leisure)                      return { label: '公園',   icon: '🌳' }
  if (amenity === 'cafe')           return { label: '咖啡廳', icon: '☕' }
  if (amenity === 'restaurant')     return { label: '餐廳',   icon: '🍜' }
  return { label: '景點', icon: '📍' }
}

export function useNearby(lat, lng, enabled) {
  const [items, setItems] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!enabled) return

    const controller = new AbortController()
    setLoading(true)
    setItems(null)

    fetch(`/api/nearby?lat=${lat}&lng=${lng}`, { signal: controller.signal })
      .then(r => r.json())
      .then(d => {
        const results = (d.elements || [])
          .map(el => {
            const meters = dist(lat, lng, el.lat, el.lon)
            if (meters > 5000) return null
            return {
              id: el.id,
              name: el.tags['name:zh'] || el.tags.name,
              dist: meters,
              lat: el.lat,
              lng: el.lon,
              ...category(el.tags),
            }
          })
          .filter(Boolean)
          .sort((a, b) => a.dist - b.dist)
          .slice(0, 12)
        setItems(results)
        setLoading(false)
      })
      .catch(e => {
        if (e.name !== 'AbortError') {
          setItems([])
          setLoading(false)
        }
      })

    return () => controller.abort()
  }, [lat, lng, enabled])

  return { items, loading }
}
