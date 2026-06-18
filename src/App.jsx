import { useState, useMemo } from 'react'
import MapView from './components/MapView'
import SearchBar from './components/SearchBar'
import FilterPanel from './components/FilterPanel'
import StationPanel from './components/StationPanel'
import TrainQuery from './components/TrainQuery'
import BottomBar, { BottomPanel } from './components/BottomBar'
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
  const [filterOpen, setFilterOpen] = useState(false)
  const [tab, setTab] = useState(null)
  const [showTrainQuery, setShowTrainQuery] = useState(false)
  const [highlightPath, setHighlightPath] = useState(null)

  const [favorites, setFavorites] = useLocalStorage('tw-train-favorites', [])
  const [visited, setVisited] = useLocalStorage('tw-train-visited', [])
  const [history, setHistory] = useLocalStorage('tw-train-history', [])
  const [notes, setNotes] = useLocalStorage('tw-train-notes', {})

  const filteredStations = useMemo(() => applyFilters(allStations, filters), [filters])
  const filteredIds = useMemo(() => new Set(filteredStations.map(s => s.id)), [filteredStations])

  const handleSelectStation = (station) => {
    setSelectedStation(station)
    setFilterOpen(false)
    setShowTrainQuery(false)
    setHistory(prev => {
      const without = prev.filter(s => s.id !== station.id)
      return [station, ...without].slice(0, 20)
    })
  }

  const handleFilterToggle = () => {
    setFilterOpen(o => !o)
    if (!filterOpen) {
      setSelectedStation(null)
      setShowTrainQuery(false)
    }
  }

  const handleTrainQueryToggle = () => {
    setShowTrainQuery(o => !o)
    if (!showTrainQuery) {
      setFilterOpen(false)
      setSelectedStation(null)
      setHighlightPath(null)
    } else {
      setHighlightPath(null)
    }
  }

  const handleMapClick = () => {
    setSelectedStation(null)
  }

  const handleHighlightPath = (origin, dest) => {
    if (!origin || !dest) { setHighlightPath(null); return }
    const path = getRoutePath(origin, dest)
    setHighlightPath(path)
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

      {/* 頂部工具列 */}
      <div className="absolute top-4 left-4 right-4 z-[999] flex items-start gap-3">
        <div className="bg-white/90 backdrop-blur rounded-2xl shadow-lg px-4 py-3 border border-[#E8D5C0] flex-shrink-0">
          <h1 className="text-base font-bold text-[#3D3535]" style={{ fontFamily: 'Noto Serif TC, serif' }}>🚂 台灣火車站地圖</h1>
        </div>

        <div className="flex-1">
          <SearchBar
            stations={allStations}
            onSelect={handleSelectStation}
            history={history}
            onClearHistory={() => setHistory([])}
          />
        </div>

        <FilterPanel
          filters={filters}
          onChange={setFilters}
          open={filterOpen}
          onToggle={handleFilterToggle}
        />

        <button onClick={handleTrainQueryToggle}
          className={`bg-white/90 backdrop-blur rounded-2xl shadow-lg px-4 py-3 border transition-colors flex-shrink-0 text-sm font-medium ${showTrainQuery ? 'border-[#E8735A] text-[#E8735A] bg-[#FFF3E8]/90' : 'border-[#E8D5C0] text-[#3D3535] hover:border-[#E8735A]'}`}>
          🚆 車程查詢
        </button>

        <button onClick={handleRandomExplore}
          className="bg-[#E8735A] text-white rounded-2xl shadow-lg px-4 py-3 hover:bg-[#D4614A] active:scale-95 transition-all flex-shrink-0 text-sm font-medium">
          🎲 隨機探索
        </button>
      </div>

      {showTrainQuery && (
        <div className="absolute top-20 right-4 z-[999]">
          <TrainQuery
            onHighlightPath={handleHighlightPath}
            onClose={() => { setShowTrainQuery(false); setHighlightPath(null) }}
          />
        </div>
      )}

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

      <BottomBar tab={tab} onTab={setTab} favorites={favorites} visited={visited} />
      <BottomPanel tab={tab} stations={allStations} favorites={favorites} visited={visited} onSelectStation={handleSelectStation} />
    </div>
  )
}
