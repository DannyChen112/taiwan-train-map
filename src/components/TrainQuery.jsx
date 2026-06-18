import { useState } from 'react'
import { queryTrains } from '../api/tdx'
import stations from '../data/stations.json'

const TRAIN_TYPE = {
  1: '太魯閣', 2: '普悠瑪', 3: '自強', 4: '莒光', 5: '復興',
  6: '區間', 7: '普快', 10: '區間快',
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

export default function TrainQuery({ onHighlightPath, onClose }) {
  const [origin, setOrigin] = useState('')
  const [dest, setDest] = useState('')
  const [date, setDate] = useState(today())
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const getStation = (name) => stations.find(s => s.name === name)

  const handleQuery = async () => {
    const origStation = getStation(origin)
    const destStation = getStation(dest)
    if (!origStation || !destStation) { setError('請輸入正確的車站名稱'); return }
    setLoading(true)
    setError('')
    setResults(null)
    try {
      const data = await queryTrains(origStation.id, destStation.id, date)
      setResults(data)
      onHighlightPath(origStation, destStation)
    } catch {
      setError('查詢失敗，請確認網路連線或稍後再試')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white/95 backdrop-blur rounded-2xl shadow-2xl border border-[#E8D5C0] p-4 w-80 z-[999]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-[#3D3535]">車程查詢</h3>
        <button onClick={() => { onClose(); onHighlightPath(null) }} className="text-[#8C7B75] hover:text-[#E8735A]">✕</button>
      </div>

      <div className="space-y-3">
        {[['出發站', origin, setOrigin], ['目的地', dest, setDest]].map(([label, val, set]) => (
          <div key={label}>
            <label className="text-xs text-[#8C7B75] font-medium">{label}</label>
            <input
              value={val}
              onChange={e => set(e.target.value)}
              placeholder={`輸入${label}名稱`}
              className="w-full mt-1 px-3 py-2.5 text-sm bg-[#FFF8EE] border border-[#E8D5C0] rounded-xl outline-none focus:border-[#E8735A] transition-colors"
              list={`stations-${label}`}
            />
            <datalist id={`stations-${label}`}>
              {stations.map(s => <option key={s.id} value={s.name} />)}
            </datalist>
          </div>
        ))}

        <div>
          <label className="text-xs text-[#8C7B75] font-medium">日期</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="w-full mt-1 px-3 py-2.5 text-sm bg-[#FFF8EE] border border-[#E8D5C0] rounded-xl outline-none focus:border-[#E8735A] transition-colors" />
        </div>

        <button onClick={handleQuery} disabled={loading}
          className="w-full py-2.5 bg-[#E8735A] text-white rounded-xl text-sm font-medium hover:bg-[#D4614A] active:scale-95 transition-all disabled:opacity-50">
          {loading ? '查詢中...' : '查詢班次'}
        </button>
      </div>

      {error && <p className="mt-3 text-xs text-[#E8735A] text-center">{error}</p>}

      {results !== null && (
        <div className="mt-4 space-y-2 max-h-64 overflow-y-auto">
          {results.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-sm text-[#8C7B75]">此區間無直達班次</p>
              <a href="https://tip.railway.gov.tw/tra-tip-web/tip/tip001/tip112/gobytime" target="_blank" rel="noopener noreferrer"
                className="inline-block mt-2 text-xs text-[#E8735A] hover:underline">查看台鐵完整時刻 →</a>
            </div>
          ) : (
            results.slice(0, 10).map((t, i) => {
              const info = t.TrainInfo
              const stops = t.StopTimes
              if (!info || !stops) return null
              const dep = stops[0]?.DepartureTime || '—'
              const arr = stops[stops.length - 1]?.ArrivalTime || '—'
              const typeLabel = TRAIN_TYPE[info.TrainTypeCode] || info.TrainTypeName || '列車'
              return (
                <div key={i} className="bg-[#FFF8EE] rounded-xl p-3 border border-[#E8D5C0]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#E8735A]">{typeLabel}</span>
                    <span className="text-xs text-[#8C7B75]">#{info.TrainNo}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm font-bold text-[#3D3535]">{dep}</span>
                    <span className="flex-1 text-center text-xs text-[#8C7B75]">→</span>
                    <span className="text-sm font-bold text-[#3D3535]">{arr}</span>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
