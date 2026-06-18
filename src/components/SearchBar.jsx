import { useState, useRef, useEffect } from 'react'

export default function SearchBar({ stations, onSelect, history, onClearHistory }) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const ref = useRef(null)

  const suggestions = query.length > 0
    ? stations.filter(s => s.name.includes(query) || s.nameEn.toLowerCase().includes(query.toLowerCase())).slice(0, 8)
    : []

  useEffect(() => {
    const handler = (e) => { if (!ref.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSelect = (station) => {
    onSelect(station)
    setQuery('')
    setOpen(false)
    setShowHistory(false)
  }

  return (
    <div ref={ref} className="relative w-full max-w-md">
      <div className="flex items-center bg-white/90 backdrop-blur rounded-2xl shadow-lg px-4 py-3 gap-2 border border-[#E8D5C0]">
        <span className="text-[#8C7B75] text-lg">🔍</span>
        <input
          className="flex-1 bg-transparent outline-none text-[#3D3535] text-base placeholder-[#8C7B75]"
          placeholder="搜尋車站名稱..."
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); setShowHistory(false) }}
          onFocus={() => { setOpen(true); if (!query) setShowHistory(true) }}
        />
        {query && (
          <button onClick={() => { setQuery(''); setOpen(false) }} className="text-[#8C7B75] hover:text-[#E8735A] text-lg">✕</button>
        )}
      </div>

      {open && (suggestions.length > 0 || showHistory) && (
        <div className="absolute top-full mt-2 w-full bg-white/95 backdrop-blur rounded-2xl shadow-xl border border-[#E8D5C0] overflow-hidden z-[1000]">

          {showHistory && history.length > 0 && (
            <>
              <div className="flex items-center justify-between px-4 pt-3 pb-1">
                <span className="text-xs text-[#8C7B75] font-medium">最近查詢</span>
                <button onClick={onClearHistory} className="text-xs text-[#E8735A] hover:underline">清除</button>
              </div>
              {history.slice(0, 5).map(s => (
                <button key={s.id} onClick={() => handleSelect(s)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#FFF3E8] text-left transition-colors">
                  <span className="text-[#8C7B75] text-sm">🕐</span>
                  <span className="text-[#3D3535] text-sm font-medium">{s.name}</span>
                  <span className="text-[#8C7B75] text-xs ml-auto">{s.line}</span>
                </button>
              ))}
              <div className="border-t border-[#E8D5C0] my-1" />
            </>
          )}

          {suggestions.map(s => (
            <button key={s.id} onClick={() => handleSelect(s)}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#FFF3E8] text-left transition-colors">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: s.status === '廢站' ? '#aaa' : '#E8735A' }} />
              <span className="text-[#3D3535] text-sm font-medium">{s.name}</span>
              <span className="text-[#8C7B75] text-xs">{s.nameEn}</span>
              <span className="text-[#8C7B75] text-xs ml-auto">{s.line}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
