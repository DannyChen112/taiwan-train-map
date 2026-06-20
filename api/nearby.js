export default async function handler(req, res) {
  const lat = parseFloat(req.query.lat)
  const lng = parseFloat(req.query.lng)
  if (isNaN(lat) || isNaN(lng)) return res.status(400).json({ error: 'invalid lat/lng' })

  const D = 0.045  // ~5km buffer in degrees
  const bbox = `${lat - D},${lng - D},${lat + D},${lng + D}`

  const QUERY = `[out:json][timeout:10];(
    node["tourism"~"^(attraction|museum|viewpoint|gallery)$"](${bbox});
    node["historic"~"^(monument|memorial|ruins|fort|castle)$"](${bbox});
    node["leisure"~"^(park|nature_reserve)$"](${bbox});
    node["amenity"~"^(restaurant|cafe)$"]["name:zh"](${bbox});
  );out body;`

  try {
    const r = await fetch(
      'https://overpass-api.de/api/interpreter?data=' + encodeURIComponent(QUERY),
      { headers: { 'User-Agent': 'taiwan-train-map/1.0' } }
    )
    if (!r.ok) throw new Error(`Overpass ${r.status}`)
    const data = await r.json()

    const elements = (data.elements || [])
      .filter(el => el.lat && el.lon && (el.tags?.name || el.tags?.['name:zh']))
      .map(el => ({
        id: el.id,
        lat: el.lat,
        lon: el.lon,
        tags: {
          name: el.tags.name,
          'name:zh': el.tags['name:zh'],
          tourism: el.tags.tourism,
          historic: el.tags.historic,
          leisure: el.tags.leisure,
          amenity: el.tags.amenity,
        },
      }))

    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400')
    res.json({ elements })
  } catch (e) {
    res.status(500).json({ error: e.message, elements: [] })
  }
}
