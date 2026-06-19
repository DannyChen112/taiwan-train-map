import { useState, useEffect, useRef } from 'react'

const RADIUS = 800
const OVERPASS_URL = 'https://overpass-api.de/api/interpreter'

const QUERY = (lat, lng) =>
  `[out:json][timeout:15];(` +
  `node["tourism"~"^(attraction|museum|viewpoint|artwork|gallery)$"](around:${RADIUS},${lat},${lng});` +
  `way["tourism"~"^(attraction|museum|viewpoint|artwork|gallery)$"](around:${RADIUS},${lat},${lng});` +
  `node["historic"](around:${RADIUS},${lat},${lng});` +
  `way["historic"](around:${RADIUS},${lat},${lng});` +
  `node["leisure"~"^(park|nature_reserve|garden)$"](around:${RADIUS},${lat},${lng});` +
  `way["leisure"~"^(park|nature_reserve|garden)$"](around:${RADIUS},${lat},${lng});` +
  `node["amenity"~"^(restaurant|cafe)$"](around:${RADIUS},${lat},${lng});` +
  `);out center;`

function getCategory(tags) {
  const { tourism, historic, leisure, amenity } = tags
  if (tourism === 'museum')    return { label: '博物館', icon: '🏛️' }
  if (tourism === 'viewpoint') return { label: '觀景點', icon: '🌄' }
  if (tourism === 'artwork')   return { label: '藝術',   icon: '🎨' }
  if (tourism === 'gallery')   return { label: '藝廊',   icon: '🖼️' }
  if (tourism)                 return { label: '景點',   icon: '📍' }
  if (historic)                return { label: '古蹟',   icon: '🏯' }
  if (leisure === 'nature_reserve') return { label: '自然區', icon: '🌿' }
  if (leisure)                 return { label: '公園',   icon: '🌳' }
  if (amenity === 'cafe')      return { label: '咖啡廳', icon: '☕' }
  if (amenity === 'restaurant') return { label: '餐廳',  icon: '🍜' }
  return { label: '景點', icon: '📍' }
}

function distMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)))
}

const cache = {}

export function useNearby(stationId, lat, lng, enabled) {
  const [items, setItems] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const controllerRef = useRef(null)

  useEffect(() => {
    if (!enabled) return

    if (cache[stationId]) {
      setItems(cache[stationId])
      return
    }

    controllerRef.current?.abort()
    const controller = new AbortController()
    controllerRef.current = controller

    setLoading(true)
    setItems(null)
    setError(false)

    fetch(OVERPASS_URL + '?data=' + encodeURIComponent(QUERY(lat, lng)), {
      signal: controller.signal,
    })
      .then(r => {
        if (!r.ok) throw new Error('HTTP ' + r.status)
        return r.json()
      })
      .then(data => {
        const results = (data.elements || [])
          .map(el => {
            const elLat = el.lat ?? el.center?.lat
            const elLng = el.lon ?? el.center?.lon
            const tags = el.tags || {}
            const name = tags['name:zh'] || tags.name
            if (!name || !elLat || !elLng) return null
            return {
              id: el.id,
              name,
              dist: distMeters(lat, lng, elLat, elLng),
              lat: elLat,
              lng: elLng,
              ...getCategory(tags),
            }
          })
          .filter(Boolean)
          .sort((a, b) => a.dist - b.dist)
          .slice(0, 12)

        cache[stationId] = results
        setItems(results)
      })
      .catch(e => {
        if (e.name !== 'AbortError') setError(true)
      })
      .finally(() => setLoading(false))

    return () => controller.abort()
  }, [stationId, enabled])

  return { items, loading, error }
}
