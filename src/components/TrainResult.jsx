import { getLineColor } from '../data/lines'

function fmtMins(mins) {
  if (mins < 60) return `${mins} 分鐘`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m === 0 ? `${h} 小時` : `${h} 小時 ${m} 分`
}

export default function TrainResult({ result, onClose }) {
  if (!result) return null
  const { origin, dest, minMins, maxMins, count } = result
  const sameTime = minMins === maxMins

  return (
    <div className="absolute top-[68px] left-3 z-[999] w-[220px] sm:w-64">
      <div className="bg-white/95 backdrop-blur rounded-2xl shadow-xl border border-[#E8D5C0] p-4">

        {/* 標題列 */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap text-[14px] font-semibold text-[#3D3535]">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: getLineColor(origin.line) }} />
              {origin.name}
            </span>
            <span className="text-[#8C7B75] font-normal text-[13px]">→</span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: getLineColor(dest.line) }} />
              {dest.name}
            </span>
          </div>
          <button onClick={onClose}
            className="text-[#8C7B75] hover:text-[#E8735A] text-[16px] leading-none flex-shrink-0 transition-colors">
            ✕
          </button>
        </div>

        {count === 0 ? (
          <div className="text-center py-2">
            <p className="text-[13px] text-[#8C7B75]">無直達班次</p>
            <a href="https://tip.railway.gov.tw/tra-tip-web/tip/tip001/tip112/gobytime"
              target="_blank" rel="noopener noreferrer"
              className="inline-block mt-1 text-[12px] text-[#E8735A] hover:underline">
              查看完整時刻 →
            </a>
          </div>
        ) : (
          <>
            <div className="bg-[#FFF8EE] rounded-xl px-3 py-2.5 border border-[#E8D5C0]">
              <div className="text-[11px] text-[#8C7B75] mb-1">行程時長</div>
              <div className="text-[18px] font-bold text-[#3D3535]">
                {sameTime ? fmtMins(minMins) : `${fmtMins(minMins)} ～ ${fmtMins(maxMins)}`}
              </div>
            </div>
            <div className="mt-2 text-[12px] text-[#8C7B75] text-center">
              今日 {count} 班直達
            </div>
          </>
        )}
      </div>
    </div>
  )
}
