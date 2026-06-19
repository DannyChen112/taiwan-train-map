import { useState, useEffect } from 'react'

// 台灣範圍 bounding box
const BBOX = '21.8,119.9,25.4,122.1'
const OVERPASS = 'https://overpass-api.de/api/interpreter'
const QUERY = encodeURIComponent(
  `[out:json][timeout:60];(` +
  `node["tourism"~"^(attraction|museum|viewpoint|artwork|gallery)$"](${BBOX});` +
  `node["historic"~"^(monument|memorial|ruins|fort|castle)$"](${BBOX});` +
  `node["leisure"~"^(park|nature_reserve|garden)$"](${BBOX});` +
  `);out body;`
)

// module 變數：頁面存活期間只查一次
let allPOIs = null   // null=未載入, []=載入完成
let initPromise = null

export function initNearby() {
  if (initPromise) return
  initPromise = fetch(`${OVERPASS}?data=${QUERY}`)
    .then(r => { if (!r.ok) throw new Error(r.status); return r.json() })
    .then(d => {
      allPOIs = (d.elements || []).filter(el =>
        el.lat && el.lon && (el.tags?.['name:zh'] || el.tags?.name)
      )
    })
    .catch(() => { allPOIs = [] })
}

function dist(lat1, lng1, lat2, lng2) {
  const R = 6371000
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)))
}

function category(tags) {
  const { tourism, historic, leisure } = tags
  if (tourism === 'museum')    return { label: '博物館', icon: '🏛️' }
  if (tourism === 'viewpoint') return { label: '觀景點', icon: '🌄' }
  if (tourism === 'artwork')   return { label: '藝術',   icon: '🎨' }
  if (tourism === 'gallery')   return { label: '藝廊',   icon: '🖼️' }
  if (tourism)                 return { label: '景點',   icon: '📍' }
  if (historic)                return { label: '古蹟',   icon: '🏯' }
  if (leisure === 'nature_reserve') return { label: '自然區', icon: '🌿' }
  if (leisure)                 return { label: '公園',   icon: '🌳' }
  return { label: '景點', icon: '📍' }
}

function filterNearby(lat, lng) {
  if (!allPOIs) return []
  return allPOIs
    .map(el => {
      const d = dist(lat, lng, el.lat, el.lon)
      if (d > 800) return null
      const tags = el.tags
      return {
        id: el.id,
        name: tags['name:zh'] || tags.name,
        dist: d,
        lat: el.lat,
        lng: el.lon,
        ...category(tags),
      }
    })
    .filter(Boolean)
    .sort((a, b) => a.dist - b.dist)
    .slice(0, 12)
}

export function useNearby(lat, lng, enabled) {
  const [items, setItems] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!enabled) return

    if (allPOIs !== null) {
      setItems(filterNearby(lat, lng))
      return
    }

    // 背景仍在載入中，等 promise 完成
    setLoading(true)
    initPromise?.then(() => {
      setItems(filterNearby(lat, lng))
      setLoading(false)
    })
  }, [lat, lng, enabled])

  return { items, loading }
}
