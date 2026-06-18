import { LINES } from '../data/lines'

export default function BottomBar({ tab, onTab, favorites, visited }) {
  const tabs = [
    { key: 'list',    label: `我的清單`, icon: '♥', count: favorites.length },
    { key: 'visited', label: '足跡地圖', icon: '✓', count: visited.length },
    { key: 'legend',  label: '路線圖例', icon: '🗺', count: 0 },
  ]

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[999]">
      <div className="bg-white/90 backdrop-blur rounded-2xl shadow-xl border border-[#E8D5C0] flex overflow-hidden">
        {tabs.map(t => (
          <button key={t.key} onClick={() => onTab(tab === t.key ? null : t.key)}
            className={`flex items-center gap-1.5 px-5 py-3 text-sm transition-colors border-r border-[#E8D5C0] last:border-0 ${tab === t.key ? 'bg-[#FFF3E8] text-[#E8735A]' : 'text-[#3D3535] hover:bg-[#FFF8EE]'}`}>
            <span>{t.icon}</span>
            <span className="font-medium">{t.label}</span>
            {t.count > 0 && <span className="bg-[#E8735A] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{t.count}</span>}
          </button>
        ))}
      </div>
    </div>
  )
}

export function BottomPanel({ tab, stations, favorites, visited, onSelectStation }) {
  if (!tab) return null

  if (tab === 'legend') {
    return (
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-[998] bg-white/95 backdrop-blur rounded-2xl shadow-xl border border-[#E8D5C0] p-4 w-80">
        <h3 className="text-sm font-semibold text-[#3D3535] mb-3">路線圖例</h3>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(LINES).map(([line, { color }]) => (
            <div key={line} className="flex items-center gap-2">
              <span className="w-5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
              <span className="text-xs text-[#3D3535]">{line}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t border-[#E8D5C0] grid grid-cols-2 gap-2 text-xs text-[#8C7B75]">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full border-2 border-dashed border-[#aaa] bg-[#aaa]/30" />
            廢站
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#E8735A]" /> 小點 = 小眾
          </div>
        </div>
      </div>
    )
  }

  const ids = tab === 'list' ? favorites : visited
  const stationList = ids.map(id => stations.find(s => s.id === id)).filter(Boolean)

  return (
    <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-[998] bg-white/95 backdrop-blur rounded-2xl shadow-xl border border-[#E8D5C0] p-4 w-80 max-h-72 overflow-y-auto">
      <h3 className="text-sm font-semibold text-[#3D3535] mb-3">
        {tab === 'list' ? '我的清單' : `足跡地圖（${visited.length} / ${stations.length} 站）`}
      </h3>

      {tab === 'visited' && (
        <div className="mb-3 h-2 bg-[#F0E8DE] rounded-full overflow-hidden">
          <div className="h-full bg-[#7BC8A4] rounded-full transition-all" style={{ width: `${(visited.length / stations.length) * 100}%` }} />
        </div>
      )}

      {stationList.length === 0 ? (
        <p className="text-sm text-[#8C7B75] text-center py-4">
          {tab === 'list' ? '還沒有收藏的車站' : '還沒有到訪紀錄'}
        </p>
      ) : (
        <div className="space-y-1.5">
          {stationList.map(s => (
            <button key={s.id} onClick={() => onSelectStation(s)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-[#FFF3E8] transition-colors text-left">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: LINES[s.line]?.color || '#888' }} />
              <span className="text-sm text-[#3D3535] font-medium">{s.name}</span>
              <span className="text-xs text-[#8C7B75] ml-auto">{s.line}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
