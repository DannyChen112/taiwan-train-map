import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { queryTrains } from '../api/tdx'
import { LINES } from '../data/lines'
import stations from '../data/stations.json'

const ALL_TAGS = ['木造站房', '海景', '山景', '老車站', '適合拍照', '溫泉', '觀光', '廢站', '小眾', '終點站', '客家', '原住民']
const ERAS = ['日治時期', '現代']
const TYPES = ['一般站', '招呼站', '廢站']
const CITIES = ['基隆市','台北市','新北市','桃園市','新竹市','新竹縣','苗栗縣','台中市','彰化縣','南投縣','雲林縣','嘉義市','嘉義縣','台南市','高雄市','屏東縣','宜蘭縣','花蓮縣','台東縣']
const TRAIN_TYPE = { 1:'太魯閣', 2:'普悠瑪', 3:'自強', 4:'莒光', 5:'復興', 6:'區間', 7:'普快', 10:'區間快' }

function today() { return new Date().toISOString().slice(0, 10) }

function StationInput({ label, value, onChange }) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState(null)
  const inputRef = useRef(null)
  const dropRef = useRef(null)

  const filtered = value.length > 0
    ? stations.filter(s => s.name.includes(value)).slice(0, 7)
    : []

  const updatePos = () => {
    if (inputRef.current) {
      const r = inputRef.current.getBoundingClientRect()
      setPos({ top: r.bottom + 4, left: r.left, width: r.width })
    }
  }

  useEffect(() => {
    const close = (e) => {
      if (!inputRef.current?.contains(e.target) && !dropRef.current?.contains(e.target))
        setOpen(false)
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('touchstart', close)
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('touchstart', close) }
  }, [])

  return (
    <div>
      <label className="text-[13px] text-[#8C7B75] font-medium">{label}</label>
      <input
        ref={inputRef}
        value={value}
        onChange={e => { onChange(e.target.value); updatePos(); setOpen(true) }}
        onFocus={() => { updatePos(); setOpen(true) }}
        placeholder={`輸入${label}名稱`}
        className="w-full mt-1 px-3 py-2 text-[14px] bg-white border border-[#E8D5C0] rounded-lg outline-none focus:border-[#E8735A] transition-colors"
      />
      {open && filtered.length > 0 && pos && createPortal(
        <div ref={dropRef}
          style={{ position: 'fixed', top: pos.top, left: pos.left, width: pos.width, zIndex: 9999 }}
          className="bg-white border border-[#E8D5C0] rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {filtered.map(s => (
            <button key={s.id}
              onClick={() => { onChange(s.name); setOpen(false) }}
              className="w-full flex items-center justify-between px-3 py-2.5 text-[13px] text-[#3D3535] hover:bg-[#FFF3E8] border-b border-[#F0E6D6] last:border-0 text-left">
              <span>{s.name}</span>
              <span className="text-[11px] text-[#8C7B75] ml-2 flex-shrink-0">{s.line}</span>
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  )
}

function ChipGroup({ label, options, selected, onChange }) {
  return (
    <div className="mb-3">
      <div className="text-[13px] text-[#8C7B75] font-medium mb-1.5">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {options.map(o => {
          const active = selected.includes(o)
          return (
            <button key={o} onClick={() => onChange(active ? selected.filter(x => x !== o) : [...selected, o])}
              className={`px-2.5 py-1 rounded-full text-[13px] border transition-all ${active
                ? 'bg-[#E8735A] text-white border-[#E8735A]'
                : 'bg-white text-[#3D3535] border-[#E8D5C0] hover:border-[#E8735A]'
              }`}>
              {o}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function Section({ title, badge, expanded, onToggle, children }) {
  return (
    <div className="border-b border-[#F0E6D6]">
      <button onClick={onToggle} className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#FFF8EE] transition-colors">
        <div className="flex items-center gap-2">
          <span className="text-[15px] font-medium text-[#3D3535]">{title}</span>
          {badge > 0 && (
            <span className="bg-[#E8735A] text-white text-[11px] rounded-full w-5 h-5 flex items-center justify-center font-medium">{badge}</span>
          )}
        </div>
        <span className="text-[#8C7B75] text-[13px]">{expanded ? '▲' : '▼'}</span>
      </button>
      {expanded && <div className="px-4 pb-4">{children}</div>}
    </div>
  )
}

function StationList({ ids, allStations, onSelectStation, emptyMsg }) {
  const list = ids.map(id => allStations.find(s => s.id === id)).filter(Boolean)
  if (list.length === 0) {
    return <p className="text-[14px] text-[#8C7B75] text-center py-3">{emptyMsg}</p>
  }
  return (
    <div className="space-y-1">
      {list.map(s => (
        <button key={s.id} onClick={() => onSelectStation(s)}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-[#FFF3E8] transition-colors text-left">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: LINES[s.line]?.color || '#888' }} />
          <span className="text-[14px] text-[#3D3535] font-medium">{s.name}</span>
          <span className="text-[13px] text-[#8C7B75] ml-auto">{s.line}</span>
        </button>
      ))}
    </div>
  )
}

export default function Drawer({ open, onClose, filters, onFiltersChange, onHighlightPath, onRandomExplore, favorites, visited, onSelectStation }) {
  const [filterOpen, setFilterOpen] = useState(false)
  const [trainOpen, setTrainOpen] = useState(false)
  const [listOpen, setListOpen] = useState(false)
  const [visitedOpen, setVisitedOpen] = useState(false)
  const [origin, setOrigin] = useState('')
  const [dest, setDest] = useState('')
  const [date, setDate] = useState(today())
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const activeCount = [
    filters.lines.length, filters.cities.length, filters.types.length,
    filters.tags.length, filters.eras.length,
    filters.passengerLevel !== 'all' ? 1 : 0,
  ].reduce((a, b) => a + b, 0)

  const handleQuery = async () => {
    const orig = stations.find(s => s.name === origin)
    const dst = stations.find(s => s.name === dest)
    if (!orig || !dst) { setError('請輸入正確的車站名稱'); return }
    setLoading(true); setError(''); setResults(null)
    try {
      const data = await queryTrains(orig.id, dst.id, date)
      setResults(data)
      onHighlightPath(orig, dst)
    } catch {
      setError('查詢失敗，請確認網路連線或稍後再試')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectAndClose = (s) => { onSelectStation(s); onClose() }

  return (
    <>
      {open && <div className="fixed inset-0 z-[994] bg-black/20" onClick={onClose} />}

      <div className={`fixed top-0 left-0 h-full w-[220px] sm:w-[272px] bg-[#FFFDF9] border-r border-[#E8D5C0] shadow-2xl z-[995] flex flex-col transition-transform duration-300 ease-out ${open ? 'translate-x-0' : '-translate-x-full'}`}>

        {/* 標題列 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#E8D5C0] flex-shrink-0">
          <span className="text-[16px] font-bold text-[#3D3535]" style={{ fontFamily: 'Noto Serif TC, serif' }}>🚂 功能選單</span>
          <button onClick={onClose} className="text-[#8C7B75] hover:text-[#E8735A] text-[18px] leading-none transition-colors">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto">

          {/* 隨機探索 */}
          <div className="p-4 border-b border-[#F0E6D6]">
            <button onClick={() => { onRandomExplore(); onClose() }}
              className="w-full py-2.5 bg-[#E8735A] text-white rounded-xl text-[15px] font-medium hover:bg-[#D4614A] active:scale-95 transition-all">
              🎲 隨機探索小站
            </button>
          </div>

          {/* 我的清單 */}
          <Section title={`♥ 我的清單`} badge={favorites.length} expanded={listOpen} onToggle={() => setListOpen(o => !o)}>
            <StationList ids={favorites} allStations={stations} onSelectStation={handleSelectAndClose} emptyMsg="還沒有收藏的車站" />
          </Section>

          {/* 足跡地圖 */}
          <Section title={`✓ 足跡地圖`} badge={visited.length} expanded={visitedOpen} onToggle={() => setVisitedOpen(o => !o)}>
            <div className="mb-3">
              <div className="flex justify-between text-[13px] text-[#8C7B75] mb-1.5">
                <span>到訪進度</span>
                <span>{visited.length} / {stations.length} 站</span>
              </div>
              <div className="h-2 bg-[#F0E8DE] rounded-full overflow-hidden">
                <div className="h-full bg-[#7BC8A4] rounded-full transition-all" style={{ width: `${(visited.length / stations.length) * 100}%` }} />
              </div>
            </div>
            <StationList ids={visited} allStations={stations} onSelectStation={handleSelectAndClose} emptyMsg="還沒有到訪紀錄" />
          </Section>

          {/* 篩選條件 */}
          <Section title="篩選條件" badge={activeCount} expanded={filterOpen} onToggle={() => setFilterOpen(o => !o)}>
            <button onClick={() => onFiltersChange({ lines: [], cities: [], types: [], tags: [], eras: [], passengerLevel: 'all' })}
              className="text-[13px] text-[#E8735A] hover:underline mb-3 block">全部清除</button>

            <div className="mb-3">
              <div className="text-[13px] text-[#8C7B75] font-medium mb-1.5">旅客量</div>
              <div className="flex gap-1.5">
                {[['all','全部'],['low','低'],['mid','中'],['high','高']].map(([val, label]) => (
                  <button key={val} onClick={() => onFiltersChange({ ...filters, passengerLevel: val })}
                    className={`flex-1 py-1.5 rounded-lg text-[13px] border transition-all ${filters.passengerLevel === val
                      ? 'bg-[#E8735A] text-white border-[#E8735A]'
                      : 'bg-white text-[#3D3535] border-[#E8D5C0] hover:border-[#E8735A]'}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <ChipGroup label="路線" options={Object.keys(LINES)} selected={filters.lines} onChange={v => onFiltersChange({ ...filters, lines: v })} />
            <ChipGroup label="縣市" options={CITIES} selected={filters.cities} onChange={v => onFiltersChange({ ...filters, cities: v })} />
            <ChipGroup label="車站類型" options={TYPES} selected={filters.types} onChange={v => onFiltersChange({ ...filters, types: v })} />
            <ChipGroup label="建築年代" options={ERAS} selected={filters.eras} onChange={v => onFiltersChange({ ...filters, eras: v })} />
            <ChipGroup label="特色標籤" options={ALL_TAGS} selected={filters.tags} onChange={v => onFiltersChange({ ...filters, tags: v })} />
          </Section>

          {/* 車程查詢 */}
          <Section title="車程查詢" expanded={trainOpen} onToggle={() => setTrainOpen(o => !o)}>
            <div className="space-y-3">
              <StationInput label="出發站" value={origin} onChange={setOrigin} />
              <StationInput label="目的地" value={dest} onChange={setDest} />
              <div>
                <label className="text-[13px] text-[#8C7B75] font-medium">日期</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)}
                  className="w-[80%] min-w-0 mt-1 px-3 py-2 text-[13px] bg-white border border-[#E8D5C0] rounded-lg outline-none focus:border-[#E8735A] transition-colors" />
              </div>
              <button onClick={handleQuery} disabled={loading}
                className="w-full py-2.5 bg-[#E8735A] text-white rounded-xl text-[15px] font-medium hover:bg-[#D4614A] active:scale-95 transition-all disabled:opacity-50">
                {loading ? '查詢中...' : '查詢班次'}
              </button>
            </div>

            {error && <p className="mt-3 text-[13px] text-[#E8735A] text-center">{error}</p>}

            {results !== null && (
              <div className="mt-3 space-y-2">
                {results.length === 0 ? (
                  <div className="text-center py-3">
                    <p className="text-[14px] text-[#8C7B75]">此區間無直達班次</p>
                    <a href="https://tip.railway.gov.tw/tra-tip-web/tip/tip001/tip112/gobytime"
                      target="_blank" rel="noopener noreferrer"
                      className="inline-block mt-1.5 text-[13px] text-[#E8735A] hover:underline">查看台鐵完整時刻 →</a>
                  </div>
                ) : results.slice(0, 10).map((t, i) => {
                  const info = t.TrainInfo
                  const stops = t.StopTimes
                  if (!info || !stops) return null
                  return (
                    <div key={i} className="bg-[#FFF8EE] rounded-xl p-2.5 border border-[#E8D5C0]">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[13px] font-semibold text-[#E8735A]">{TRAIN_TYPE[info.TrainTypeCode] || info.TrainTypeName || '列車'}</span>
                        <span className="text-[12px] text-[#8C7B75]">#{info.TrainNo}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[15px] font-bold text-[#3D3535]">{stops[0]?.DepartureTime || '—'}</span>
                        <span className="flex-1 text-center text-[12px] text-[#8C7B75]">→</span>
                        <span className="text-[15px] font-bold text-[#3D3535]">{stops[stops.length - 1]?.ArrivalTime || '—'}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Section>

        </div>
      </div>
    </>
  )
}
