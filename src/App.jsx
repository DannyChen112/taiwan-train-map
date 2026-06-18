import { useState, useMemo } from 'react'
import MapView from './components/MapView'
import SearchBar from './components/SearchBar'
import StationPanel from './components/StationPanel'
import Drawer from './components/Drawer'
import { useLocalStorage } from './hooks/useLocalStorage'
import { getRoutePath } from './data/lines'
import allStations from './data/stations.json'

const DEFAULT_FILTERS = { lines: [], cities: [], types: [], tags: [], eras: [], passengerLevel: 'all' }

function applyFilters(stations, filters) {
  return stations.filter(s => {
    if (filters.lines.length && !filters.lines.includes(s.line)) return false
    if (filters.cities.length && !filters.cities.includes(s.city)) return false
    if (filters.types.length && !filters.types.includes(s.type)) return false
    if (filters.eras.length && !filters.eras.includes(s.builtEra)) return false
    if (filters.tags.length && !filters.tags.some(t => s.tags.includes(t))) return false
    if (filters.passengerLevel === 'low' && s.dailyPassengers >= 500) return false
    if (filters.passengerLevel === 'mid' && (s.dailyPassengers < 500 || s.dailyPassengers >= 10000)) return false
    if (filters.passengerLevel === 'high' && s.dailyPassengers < 10000) return false
    return true
  })
}

export default function App() {
  const [selectedStation, setSelectedStation] = useState(null)
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [highlightPath, setHighlightPath] = useState(null)

  const [favorites, setFavorites] = useLocalStorage('tw-train-favorites', [])
  const [visited, setVisited] = useLocalStorage('tw-train-visited', [])
  const [history, setHistory] = useLocalStorage('tw-train-history', [])
  const [notes, setNotes] = useLocalStorage('tw-train-notes', {})

  const filteredStations = useMemo(() => applyFilters(allStations, filters), [filters])
  const filteredIds = useMemo(() => new Set(filteredStations.map(s => s.id)), [filteredStations])

  const handleSelectStation = (station) => {
    setSelectedStation(station)
    setDrawerOpen(false)
    setHistory(prev => {
      const without = prev.filter(s => s.id !== station.id)
      return [station, ...without].slice(0, 20)
    })
  }

  const handleMapClick = () => setSelectedStation(null)

  const handleHighlightPath = (origin, dest) => {
    if (!origin || !dest) { setHighlightPath(null); return }
    setHighlightPath(getRoutePath(origin, dest))
  }

  const handleRandomExplore = () => {
    const lowTraffic = allStations.filter(s => s.dailyPassengers > 0 && s.dailyPassengers < 300)
    const pick = lowTraffic[Math.floor(Math.random() * lowTraffic.length)]
    handleSelectStation(pick)
  }

  const toggleFavorite = (id) => setFavorites(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  const toggleVisited = (id) => setVisited(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <MapView
        stations={allStations}
        filteredIds={filteredIds}
        selectedStation={selectedStation}
        onSelectStation={handleSelectStation}
        onMapClick={handleMapClick}
        highlightPath={highlightPath}
      />

      {/* 頂部工具列：漢堡 + 搜尋（抽屜開啟時隱藏） */}
      {!drawerOpen && <div className="absolute top-3 left-3 right-3 z-[999] flex items-center gap-2">
        <button
          onClick={() => { setDrawerOpen(true); setSelectedStation(null) }}
          className="bg-white/90 backdrop-blur rounded-xl shadow-lg w-10 h-10 border border-[#E8D5C0] hover:border-[#E8735A] flex-shrink-0 flex items-center justify-center text-[18px] transition-colors"
          aria-label="開啟選單">
          ☰
        </button>
        <div className="min-w-0 max-w-[220px]">
          <SearchBar
            stations={allStations}
            onSelect={handleSelectStation}
            history={history}
            onClearHistory={() => setHistory([])}
          />
        </div>
      </div>}

      {/* 側邊抽屜 */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        filters={filters}
        onFiltersChange={setFilters}
        onHighlightPath={handleHighlightPath}
        onRandomExplore={handleRandomExplore}
        favorites={favorites}
        visited={visited}
        onSelectStation={handleSelectStation}
      />

      {/* 車站資訊面板 */}
      {selectedStation && (
        <StationPanel
          station={selectedStation}
          onClose={() => setSelectedStation(null)}
          isFavorite={favorites.includes(selectedStation.id)}
          isVisited={visited.includes(selectedStation.id)}
          onToggleFavorite={() => toggleFavorite(selectedStation.id)}
          onToggleVisited={() => toggleVisited(selectedStation.id)}
          note={notes[selectedStation.id] || ''}
          onNoteChange={(v) => setNotes(prev => ({ ...prev, [selectedStation.id]: v }))}
        />
      )}

    </div>
  )
}
