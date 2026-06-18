import { useRef, useEffect, useMemo } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { LINE_PATHS, TRUNK_LINES, TRUNK_COLOR, BRANCH_COLOR, SELECTED_COLOR } from '../data/lines'

const MAP_STYLE = {
  version: 8,
  sources: {
    terrain: {
      type: 'raster',
      tiles: ['https://tiles.stadiamaps.com/tiles/stamen_terrain/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '&copy; <a href="https://stamen.com">Stamen</a> &copy; <a href="https://stadiamaps.com">Stadia Maps</a> &copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
    }
  },
  layers: [{
    id: 'terrain-layer',
    type: 'raster',
    source: 'terrain',
    paint: {
      'raster-saturation': -0.28,
      'raster-brightness-max': 1.0,
      'raster-contrast': -0.08
    }
  }]
}

function passengerToRadius(p) {
  if (p < 100) return 5
  if (p < 500) return 6
  if (p < 3000) return 8
  if (p < 20000) return 10
  if (p < 60000) return 13
  return 16
}

function buildLinesGeoJSON() {
  return {
    type: 'FeatureCollection',
    features: Object.entries(LINE_PATHS).map(([line, coords]) => ({
      type: 'Feature',
      geometry: { type: 'LineString', coordinates: coords.map(([lat, lng]) => [lng, lat]) },
      properties: { line, isTrunk: TRUNK_LINES.has(line) }
    }))
  }
}

const EMPTY_GEOJSON = { type: 'FeatureCollection', features: [] }

export default function MapView({ stations, filteredIds, selectedStation, onSelectStation, onMapClick, highlightPath }) {
  const containerRef = useRef()
  const mapRef = useRef()

  // Use refs for callbacks to avoid stale closures in the map event handlers
  const stationsRef = useRef(stations)
  const onSelectStationRef = useRef(onSelectStation)
  const onMapClickRef = useRef(onMapClick)
  useEffect(() => { stationsRef.current = stations }, [stations])
  useEffect(() => { onSelectStationRef.current = onSelectStation }, [onSelectStation])
  useEffect(() => { onMapClickRef.current = onMapClick }, [onMapClick])

  const stationsGeoJSON = useMemo(() => ({
    type: 'FeatureCollection',
    features: stations.map(s => {
      const isSelected = selectedStation?.id === s.id
      return {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [s.lng, s.lat] },
        properties: {
          id: s.id,
          status: s.status,
          isTrunk: TRUNK_LINES.has(s.line),
          filtered: filteredIds ? !filteredIds.has(s.id) : false,
          selected: isSelected,
          radius: passengerToRadius(s.dailyPassengers) + (isSelected ? 3 : 0)
        }
      }
    })
  }), [stations, filteredIds, selectedStation])

  const highlightGeoJSON = useMemo(() => {
    if (!highlightPath || highlightPath.length < 2) return null
    return {
      type: 'Feature',
      geometry: { type: 'LineString', coordinates: highlightPath.map(([lat, lng]) => [lng, lat]) },
      properties: {}
    }
  }, [highlightPath])

  // Initialize map once
  useEffect(() => {
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: [121.0, 23.8],
      zoom: 8,
      attributionControl: { compact: true }
    })
    mapRef.current = map

    map.on('load', () => {
      // Railway lines
      map.addSource('lines', { type: 'geojson', data: buildLinesGeoJSON() })
      map.addLayer({
        id: 'lines-layer',
        type: 'line',
        source: 'lines',
        paint: {
          'line-color': ['case', ['boolean', ['get', 'isTrunk'], false], TRUNK_COLOR, BRANCH_COLOR],
          'line-width': ['case', ['boolean', ['get', 'isTrunk'], false], 3, 2.5],
          'line-opacity': 0.8
        }
      })

      // Highlight path
      map.addSource('highlight', { type: 'geojson', data: EMPTY_GEOJSON })
      map.addLayer({
        id: 'highlight-layer',
        type: 'line',
        source: 'highlight',
        paint: { 'line-color': SELECTED_COLOR, 'line-width': 5, 'line-opacity': 1 }
      })

      // Station circles
      map.addSource('stations', { type: 'geojson', data: EMPTY_GEOJSON })
      map.addLayer({
        id: 'stations-layer',
        type: 'circle',
        source: 'stations',
        paint: {
          'circle-radius': ['get', 'radius'],
          'circle-color': ['case',
            ['boolean', ['get', 'selected'], false], SELECTED_COLOR,
            ['==', ['get', 'status'], '廢站'], '#999',
            ['boolean', ['get', 'isTrunk'], false], TRUNK_COLOR,
            BRANCH_COLOR
          ],
          'circle-stroke-color': ['case',
            ['boolean', ['get', 'selected'], false], SELECTED_COLOR, 'white'
          ],
          'circle-stroke-width': ['case', ['boolean', ['get', 'selected'], false], 3, 1.5],
          'circle-opacity': ['case',
            ['boolean', ['get', 'filtered'], false], 0.08,
            ['==', ['get', 'status'], '廢站'], 0.45,
            0.92
          ],
          'circle-stroke-opacity': ['case', ['boolean', ['get', 'filtered'], false], 0.12, 1]
        }
      })

      // Click handler: station or empty area
      map.on('click', (e) => {
        const features = map.queryRenderedFeatures(e.point, { layers: ['stations-layer'] })
        if (features.length > 0) {
          const stationId = features[0].properties.id
          const station = stationsRef.current.find(s => s.id === stationId)
          if (station) { onSelectStationRef.current(station); return }
        }
        onMapClickRef.current()
      })

      map.on('mouseenter', 'stations-layer', () => { map.getCanvas().style.cursor = 'pointer' })
      map.on('mouseleave', 'stations-layer', () => { map.getCanvas().style.cursor = '' })
    })

    return () => map.remove()
  }, [])

  // Update stations source data
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const apply = () => map.getSource('stations')?.setData(stationsGeoJSON)
    if (map.getSource('stations')) apply()
    else map.once('load', apply)
  }, [stationsGeoJSON])

  // Update highlight path
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const apply = () => {
      if (!map.getSource('highlight')) return
      if (highlightGeoJSON) {
        map.getSource('highlight').setData(highlightGeoJSON)
        map.setPaintProperty('lines-layer', 'line-opacity', 0.2)
      } else {
        map.getSource('highlight').setData(EMPTY_GEOJSON)
        map.setPaintProperty('lines-layer', 'line-opacity', 0.8)
      }
    }
    if (map.getSource('highlight')) apply()
    else map.once('load', apply)
  }, [highlightGeoJSON])

  // FlyTo when station selected
  useEffect(() => {
    const map = mapRef.current
    if (!map || !selectedStation) return
    map.flyTo({
      center: [selectedStation.lng, selectedStation.lat],
      zoom: Math.max(map.getZoom(), 13),
      duration: 700
    })
  }, [selectedStation])

  return <div ref={containerRef} style={{ width: '100%', height: '100vh' }} />
}
