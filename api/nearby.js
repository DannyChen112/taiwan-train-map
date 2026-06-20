const QUERY = `[out:json][timeout:8];(
  node["tourism"~"^(attraction|museum|viewpoint|gallery)$"](21.8,119.9,25.4,122.1);
  node["historic"~"^(monument|memorial|ruins|fort|castle)$"](21.8,119.9,25.4,122.1);
  node["leisure"~"^(park|nature_reserve)$"](21.8,119.9,25.4,122.1);
  node["amenity"~"^(restaurant|cafe)$"](21.8,119.9,25.4,122.1);
);out body;`

export default async function handler(req, res) {
  try {
    const r = await fetch(
      'https://overpass-api.de/api/interpreter?data=' + encodeURIComponent(QUERY),
      { headers: { 'User-Agent': 'taiwan-train-map/1.0 (https://taiwan-train-map.vercel.app)' } }
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
