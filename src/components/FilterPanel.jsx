import { LINES } from '../data/lines'

const ALL_TAGS = ['木造站房', '海景', '山景', '老車站', '適合拍照', '溫泉', '觀光', '廢站', '小眾', '終點站', '客家', '原住民']
const ERAS = ['日治時期', '現代']
const TYPES = ['一般站', '招呼站', '廢站']
const CITIES = ['基隆市','台北市','新北市','桃園市','新竹市','新竹縣','苗栗縣','台中市','彰化縣','南投縣','雲林縣','嘉義市','嘉義縣','台南市','高雄市','屏東縣','宜蘭縣','花蓮縣','台東縣']

function ChipGroup({ label, options, selected, onChange }) {
  return (
    <div className="mb-4">
      <div className="text-xs text-[#8C7B75] font-medium mb-2">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {options.map(o => {
          const active = selected.includes(o)
          return (
            <button key={o} onClick={() => onChange(active ? selected.filter(x => x !== o) : [...selected, o])}
              className={`px-2.5 py-1 rounded-full text-xs border transition-all ${active
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

export default function FilterPanel({ filters, onChange, open, onToggle, className = '' }) {
  const activeCount = [
    filters.lines.length, filters.cities.length, filters.types.length,
    filters.tags.length, filters.eras.length,
    filters.passengerLevel !== 'all' ? 1 : 0,
  ].reduce((a, b) => a + b, 0)

  return (
    <div className={`relative ${className}`}>
      <button onClick={onToggle}
        className="w-full flex items-center justify-center gap-2 bg-white/90 backdrop-blur rounded-2xl shadow-lg px-4 py-3 border border-[#E8D5C0] hover:border-[#E8735A] transition-colors">
        <span className="text-base">篩選</span>
        {activeCount > 0 && (
          <span className="bg-[#E8735A] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">{activeCount}</span>
        )}
        <span className="text-[#8C7B75] text-sm">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white/95 backdrop-blur rounded-2xl shadow-xl border border-[#E8D5C0] p-4 z-[1000] max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-[#3D3535]">篩選條件</span>
            <button onClick={() => onChange({ lines: [], cities: [], types: [], tags: [], eras: [], passengerLevel: 'all' })}
              className="text-xs text-[#E8735A] hover:underline">全部清除</button>
          </div>

          <div className="mb-4">
            <div className="text-xs text-[#8C7B75] font-medium mb-2">旅客量</div>
            <div className="flex gap-2">
              {[['all', '全部'], ['low', '低'], ['mid', '中'], ['high', '高']].map(([val, label]) => (
                <button key={val}
                  onClick={() => onChange({ ...filters, passengerLevel: val })}
                  className={`flex-1 py-1.5 rounded-xl text-xs border transition-all ${filters.passengerLevel === val
                    ? 'bg-[#E8735A] text-white border-[#E8735A]'
                    : 'bg-white text-[#3D3535] border-[#E8D5C0] hover:border-[#E8735A]'
                  }`}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <ChipGroup label="路線" options={Object.keys(LINES)} selected={filters.lines}
            onChange={v => onChange({ ...filters, lines: v })} />
          <ChipGroup label="縣市" options={CITIES} selected={filters.cities}
            onChange={v => onChange({ ...filters, cities: v })} />
          <ChipGroup label="車站類型" options={TYPES} selected={filters.types}
            onChange={v => onChange({ ...filters, types: v })} />
          <ChipGroup label="建築年代" options={ERAS} selected={filters.eras}
            onChange={v => onChange({ ...filters, eras: v })} />
          <ChipGroup label="特色標籤" options={ALL_TAGS} selected={filters.tags}
            onChange={v => onChange({ ...filters, tags: v })} />
        </div>
      )}
    </div>
  )
}
