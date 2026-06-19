import { useState } from 'react'
import { getLineColor } from '../data/lines'
import { useStationPhoto } from '../hooks/useStationPhoto'
import { useWeather } from '../hooks/useWeather'
import { useNearby } from '../hooks/useNearby'
import { DESCRIPTIONS } from '../data/descriptions'

function PassengerBar({ count }) {
  const max = 120000
  const pct = Math.min((count / max) * 100, 100)
  const label = count === 0 ? '廢站' : count < 100 ? '極低' : count < 1000 ? '低' : count < 10000 ? '中' : '高'
  return (
    <div>
      <div className="flex justify-between text-xs text-[#8C7B75] mb-1">
        <span>日均旅客量</span>
        <span>{count === 0 ? '—' : `${count.toLocaleString()} 人・${label}`}</span>
      </div>
      <div className="h-2 bg-[#F0E8DE] rounded-full overflow-hidden">
        <div className="h-full bg-[#E8735A] rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function StationPhoto({ station }) {
  const { photo, loading } = useStationPhoto(station.links.wikipedia, station.nameEn)
  const lineColor = getLineColor(station.line)

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#F0E8DE]">
        <span className="text-[#8C7B75] text-sm">載入照片中...</span>
      </div>
    )
  }

  if (photo) {
    return <img src={photo} alt={station.name} className="w-full h-full object-cover" />
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-2"
      style={{ background: `linear-gradient(135deg, ${lineColor}22, ${lineColor}44)` }}>
      <span className="text-4xl">🚉</span>
      <span className="text-[#3D3535] font-semibold text-base" style={{ fontFamily: 'Noto Serif TC, serif' }}>{station.name}</span>
      <span className="text-[#8C7B75] text-xs">{station.line}</span>
    </div>
  )
}

export default function StationPanel({ station, onClose, isFavorite, isVisited, onToggleFavorite, onToggleVisited, note, onNoteChange }) {
  const [showNote, setShowNote] = useState(false)
  if (!station) return null

  const lineColor = getLineColor(station.line)
  const description = DESCRIPTIONS[station.id] || `位於${station.city}的${station.type}，${station.line}上的停靠站。`
  const lastTrain = station.dailyPassengers < 200 && station.dailyPassengers > 0
  const { weather, loading: weatherLoading } = useWeather(station.lat, station.lng)
  const [showNearby, setShowNearby] = useState(false)
  const { items: nearbyItems, loading: nearbyLoading } = useNearby(station.lat, station.lng, showNearby)

  return (
    <div className="fixed z-[999] flex flex-col
      bottom-0 left-0 right-0 h-[58vh]
      sm:bottom-4 sm:left-auto sm:right-4 sm:top-20 sm:w-80 sm:h-auto">

      {/* 手機版拖曳把手 */}
      <div className="sm:hidden flex justify-center pt-2 pb-1 bg-white rounded-t-2xl border-t border-x border-[#E8D5C0] flex-shrink-0">
        <div className="w-10 h-1 bg-[#D5C8BE] rounded-full" />
      </div>

      <div className="bg-white/96 backdrop-blur shadow-2xl border border-[#E8D5C0] flex flex-col overflow-hidden h-full
        rounded-b-none rounded-t-none sm:rounded-2xl
        border-t-0 sm:border-t">

        {/* 車站照片 */}
        <div className="relative flex-shrink-0 overflow-hidden rounded-none sm:rounded-t-2xl">
          <div className="h-32 sm:h-44">
            <StationPhoto station={station} />
          </div>
          <button onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 bg-white/80 backdrop-blur rounded-full flex items-center justify-center text-[#3D3535] hover:bg-white shadow-md transition-colors text-sm z-10">
            ✕
          </button>
          {station.status === '廢站' && (
            <div className="absolute top-3 left-3 bg-[#8C7B75]/85 text-white text-xs px-2.5 py-1 rounded-full z-10">廢站</div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">

          {/* 站名 */}
          <div>
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-xl font-bold text-[#3D3535]" style={{ fontFamily: 'Noto Serif TC, serif' }}>{station.name}</h2>
                <p className="text-sm text-[#8C7B75]">{station.nameEn}</p>
              </div>
              <div className="flex gap-1.5 flex-shrink-0 mt-1">
                <button onClick={onToggleFavorite}
                  className={`w-9 h-9 rounded-full border flex items-center justify-center text-lg transition-all ${isFavorite ? 'bg-[#FFF0EB] border-[#E8735A] text-[#E8735A]' : 'bg-white border-[#E8D5C0] text-[#8C7B75] hover:border-[#E8735A]'}`}
                  title={isFavorite ? '取消收藏' : '加入清單'}>
                  {isFavorite ? '♥' : '♡'}
                </button>
                <button onClick={onToggleVisited}
                  className={`w-9 h-9 rounded-full border flex items-center justify-center text-base transition-all ${isVisited ? 'bg-[#EBF5F0] border-[#7BC8A4] text-[#7BC8A4]' : 'bg-white border-[#E8D5C0] text-[#8C7B75] hover:border-[#7BC8A4]'}`}
                  title={isVisited ? '取消到訪' : '標記到訪'}>
                  {isVisited ? '✓' : '○'}
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: lineColor }} />
              <span className="text-sm text-[#8C7B75]">{station.line}・{station.city}</span>
            </div>
          </div>

          {/* 車站介紹 */}
          <div className="bg-[#FFF8EE] rounded-xl p-3 border border-[#E8D5C0]">
            <p className="text-sm text-[#3D3535] leading-relaxed">{description}</p>
          </div>

          {/* 基本資訊 */}
          <div className="grid grid-cols-2 gap-2">
            {[
              ['車站類型', station.type],
              ['海拔高度', station.altitude > 0 ? `${station.altitude} m` : '—'],
              ['建築年代', station.builtEra],
              ['狀態', station.status],
            ].map(([k, v]) => (
              <div key={k} className="bg-[#FFF8EE] rounded-xl p-2.5">
                <div className="text-xs text-[#8C7B75]">{k}</div>
                <div className="text-sm font-medium text-[#3D3535] mt-0.5">{v}</div>
              </div>
            ))}
          </div>

          {/* 旅客量 */}
          <PassengerBar count={station.dailyPassengers} />

          {/* 即時天氣 */}
          <div className="bg-[#FFF8EE] rounded-xl p-3 border border-[#E8D5C0]">
            <div className="text-xs text-[#8C7B75] font-medium mb-2">即時天氣</div>
            {weatherLoading ? (
              <p className="text-xs text-[#8C7B75]">載入中...</p>
            ) : weather ? (
              <div className="flex items-center gap-3">
                <span className="text-3xl leading-none">{weather.icon}</span>
                <div>
                  <div className="text-xl font-bold text-[#3D3535] leading-tight">{weather.temp}°C</div>
                  <div className="text-xs text-[#8C7B75]">{weather.label}</div>
                </div>
                <div className="ml-auto text-right text-xs text-[#8C7B75] space-y-0.5">
                  <div>濕度 {weather.humidity}%</div>
                  <div>風速 {weather.wind} km/h</div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-[#8C7B75]">無法取得天氣資料</p>
            )}
          </div>

          {/* 末班車警示 */}
          {lastTrain && (
            <div className="bg-[#FFF3E8] border border-[#E8735A]/30 rounded-xl p-3 flex gap-2 items-start">
              <span className="text-[#E8735A] text-base">⚠</span>
              <span className="text-xs text-[#E8735A]">此站班次較少，出發前請務必確認末班車時間，避免滯留。</span>
            </div>
          )}

          {/* 標籤 */}
          {station.tags.length > 0 && (
            <div>
              <div className="text-xs text-[#8C7B75] font-medium mb-2">特色標籤</div>
              <div className="flex flex-wrap gap-1.5">
                {station.tags.map(tag => (
                  <span key={tag} className="bg-[#FFF3E8] text-[#8C7B75] text-xs px-2.5 py-1 rounded-full border border-[#E8D5C0]">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 外部連結 */}
          <div className="grid grid-cols-2 gap-2">
            <a href={station.links.wikipedia} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-[#E8D5C0] text-sm text-[#3D3535] hover:bg-[#FFF3E8] hover:border-[#E8735A] transition-all">
              📖 維基百科
            </a>
            <a href={station.links.googleMaps} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-[#E8D5C0] text-sm text-[#3D3535] hover:bg-[#FFF3E8] hover:border-[#E8735A] transition-all">
              📍 地圖
            </a>
          </div>

          {/* 附近景點 */}
          <div>
            <button onClick={() => setShowNearby(o => !o)}
              className="flex items-center gap-1.5 text-xs text-[#8C7B75] hover:text-[#E8735A] transition-colors">
              🗺️ <span>{showNearby ? '收起附近景點' : '附近景點'}</span>
              <span className="text-[#8C7B75] text-[11px]">{showNearby ? '▲' : '▼'}</span>
            </button>
            {showNearby && (
              <div className="mt-2">
                {nearbyLoading && (
                  <p className="text-xs text-[#8C7B75] py-2">查詢中...</p>
                )}
                {nearbyItems && nearbyItems.length === 0 && (
                  <p className="text-xs text-[#8C7B75] py-2">此站 5km 內暫無景點資訊</p>
                )}
                {nearbyItems && nearbyItems.length > 0 && (
                  <div className="space-y-1.5 mt-1">
                    {nearbyItems.map(item => (
                      <a key={item.id}
                        href={`https://www.google.com/maps?q=${item.lat},${item.lng}`}
                        target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-[#FFF8EE] border border-[#E8D5C0] hover:border-[#E8735A] transition-colors">
                        <span className="text-base leading-none flex-shrink-0">{item.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-[#3D3535] truncate">{item.name}</div>
                          <div className="text-xs text-[#8C7B75]">{item.label}・{item.dist} m</div>
                        </div>
                        <span className="text-[#8C7B75] text-xs flex-shrink-0">↗</span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 個人筆記 */}
          <div>
            <button onClick={() => setShowNote(!showNote)}
              className="flex items-center gap-1.5 text-xs text-[#8C7B75] hover:text-[#E8735A] transition-colors">
              📝 <span>{showNote ? '收起筆記' : '個人筆記'}</span>
              {note && <span className="w-1.5 h-1.5 rounded-full bg-[#E8735A]" />}
            </button>
            {showNote && (
              <textarea value={note || ''} onChange={e => onNoteChange(e.target.value)}
                placeholder="記下你對這個車站的想法..."
                className="w-full mt-2 p-3 text-sm text-[#3D3535] bg-[#FFF8EE] border border-[#E8D5C0] rounded-xl resize-none outline-none focus:border-[#E8735A] transition-colors"
                rows={4} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
