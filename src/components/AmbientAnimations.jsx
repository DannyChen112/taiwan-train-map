export default function AmbientAnimations() {
  return (
    <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
      {/* 小船 */}
      <div className="absolute boat-sway" style={{ top: '38%', left: '6%' }}>
        <svg width="32" height="20" viewBox="0 0 32 20" opacity="0.55">
          <path d="M4 14 Q16 6 28 14" stroke="#6B9FD4" strokeWidth="1.5" fill="none"/>
          <path d="M14 14 L16 4 L18 14" fill="#C9A84C" opacity="0.7"/>
          <ellipse cx="16" cy="15" rx="12" ry="3" fill="#A8D8EA" opacity="0.6"/>
        </svg>
      </div>

      {/* 第二艘小船 */}
      <div className="absolute boat-sway" style={{ top: '55%', left: '3%', animationDelay: '1.2s', animationDuration: '4s' }}>
        <svg width="24" height="16" viewBox="0 0 24 16" opacity="0.4">
          <path d="M3 11 Q12 5 21 11" stroke="#6B9FD4" strokeWidth="1.2" fill="none"/>
          <path d="M11 11 L12 3 L13 11" fill="#C9A84C" opacity="0.6"/>
          <ellipse cx="12" cy="12" rx="9" ry="2.5" fill="#A8D8EA" opacity="0.5"/>
        </svg>
      </div>

      {/* 太平洋小船 */}
      <div className="absolute boat-sway" style={{ top: '45%', right: '4%', animationDelay: '0.6s', animationDuration: '3.5s' }}>
        <svg width="28" height="18" viewBox="0 0 28 18" opacity="0.45">
          <path d="M3 12 Q14 5 25 12" stroke="#7BA7C4" strokeWidth="1.3" fill="none"/>
          <path d="M12 12 L14 4 L16 12" fill="#D4856A" opacity="0.6"/>
          <ellipse cx="14" cy="13" rx="11" ry="2.8" fill="#A8D8EA" opacity="0.5"/>
        </svg>
      </div>

      {/* 海浪（左側台灣海峽） */}
      {[0, 1, 2].map(i => (
        <div key={i} className="absolute wave-anim" style={{
          top: `${40 + i * 8}%`, left: `${4 + i * 1.5}%`,
          animationDelay: `${i * 0.5}s`, animationDuration: `${2 + i * 0.3}s`
        }}>
          <svg width="40" height="12" viewBox="0 0 40 12" opacity="0.3">
            <path d="M0 6 Q10 2 20 6 Q30 10 40 6" stroke="#A8D8EA" strokeWidth="1.5" fill="none"/>
          </svg>
        </div>
      ))}

      {/* 海浪（右側太平洋） */}
      {[0, 1].map(i => (
        <div key={`r${i}`} className="absolute wave-anim" style={{
          top: `${43 + i * 9}%`, right: `${3 + i * 1.5}%`,
          animationDelay: `${i * 0.7 + 0.3}s`, animationDuration: `${2.2 + i * 0.4}s`
        }}>
          <svg width="35" height="10" viewBox="0 0 35 10" opacity="0.25">
            <path d="M0 5 Q8.75 2 17.5 5 Q26.25 8 35 5" stroke="#7BA7C4" strokeWidth="1.2" fill="none"/>
          </svg>
        </div>
      ))}

      {/* 山區雲朵 */}
      {[
        { top: '22%', left: '30%', delay: '0s', dur: '9s' },
        { top: '18%', left: '48%', delay: '2s', dur: '11s' },
        { top: '25%', left: '60%', delay: '4s', dur: '8s' },
      ].map((c, i) => (
        <div key={`cloud${i}`} className="absolute cloud-drift" style={{ top: c.top, left: c.left, animationDelay: c.delay, animationDuration: c.dur }}>
          <svg width="48" height="24" viewBox="0 0 48 24" opacity="0.35">
            <ellipse cx="24" cy="16" rx="18" ry="8" fill="white"/>
            <ellipse cx="18" cy="14" rx="12" ry="7" fill="white"/>
            <ellipse cx="30" cy="13" rx="10" ry="6" fill="white"/>
          </svg>
        </div>
      ))}
    </div>
  )
}
