/**
 * Decoración navideña del banner de colecciones (tema "Navidad"): rama de pino con esferas colgantes,
 * estrella, regalo, arbolito y copos de nieve. Dibujo propio en SVG (sin imágenes externas).
 */
export function ChristmasDecor() {
  const flakes = [
    [6, 18, 1], [14, 70, 0.8], [24, 30, 0.6], [33, 82, 0.9], [41, 14, 0.7], [47, 58, 0.5], [53, 88, 0.8], [58, 26, 0.6],
  ]
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Copos de nieve en todo el banner */}
      {flakes.map(([left, top, scale], i) => (
        <svg key={i} viewBox="0 0 24 24" className="absolute text-white/25" style={{ left: `${left}%`, top: `${top}%`, width: 18 * scale, height: 18 * scale }}>
          <g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" fill="none">
            <path d="M12 2v20M3.3 7l17.4 10M3.3 17L20.7 7" />
            <path d="M9.5 3.5L12 6l2.5-2.5M9.5 20.5L12 18l2.5 2.5" />
          </g>
        </svg>
      ))}

      {/* Escena de la derecha: rama, esferas, estrella, arbolito y regalo */}
      <svg viewBox="0 0 520 220" preserveAspectRatio="xMaxYMid slice" className="absolute top-0 hidden h-full md:block md:right-[210px] md:w-[40%] max-w-[560px]">
        <defs>
          <radialGradient id="bRed" cx="35%" cy="30%" r="70%"><stop offset="0" stopColor="#ff6b6b" /><stop offset=".55" stopColor="#d11a2a" /><stop offset="1" stopColor="#7a0a14" /></radialGradient>
          <radialGradient id="bGold" cx="35%" cy="30%" r="70%"><stop offset="0" stopColor="#fff1b8" /><stop offset=".5" stopColor="#e9b949" /><stop offset="1" stopColor="#8a5a12" /></radialGradient>
          <radialGradient id="bGreen" cx="35%" cy="30%" r="70%"><stop offset="0" stopColor="#7ee0a1" /><stop offset=".55" stopColor="#1f8a4c" /><stop offset="1" stopColor="#0b4226" /></radialGradient>
          <linearGradient id="tree" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2fa860" /><stop offset="1" stopColor="#0f5a32" /></linearGradient>
          <linearGradient id="gift" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#e23a44" /><stop offset="1" stopColor="#8f0f1c" /></linearGradient>
        </defs>

        {/* Rama de pino en la parte superior */}
        <g>
          <path d="M140 18 C 230 34, 330 30, 520 6" stroke="#5a3a1e" strokeWidth="5" fill="none" strokeLinecap="round" />
          {Array.from({ length: 26 }).map((_, i) => {
            const x = 150 + i * 14
            const y = 24 - i * 0.55 + Math.sin(i) * 2
            return (
              <g key={i} stroke={i % 2 ? "#1e7a45" : "#2c9a58"} strokeWidth="3" strokeLinecap="round">
                <path d={`M${x} ${y} l -10 ${14 + (i % 3) * 3}`} />
                <path d={`M${x} ${y} l 9 ${15 + (i % 2) * 4}`} />
                <path d={`M${x} ${y} l -12 -${8 + (i % 2) * 3}`} />
                <path d={`M${x} ${y} l 11 -${9 + (i % 3) * 2}`} />
              </g>
            )
          })}
        </g>

        {/* Esferas colgantes */}
        {[
          { x: 200, len: 46, r: 15, f: "url(#bRed)" },
          { x: 262, len: 76, r: 19, f: "url(#bGold)" },
          { x: 318, len: 40, r: 13, f: "url(#bGreen)" },
          { x: 470, len: 58, r: 17, f: "url(#bRed)" },
        ].map((b, i) => (
          <g key={i}>
            <line x1={b.x} y1={22} x2={b.x} y2={22 + b.len} stroke="#f4d58d" strokeWidth="1.3" />
            <rect x={b.x - 4} y={18 + b.len} width="8" height="7" rx="1.5" fill="#d9b25a" />
            <circle cx={b.x} cy={25 + b.len + b.r} r={b.r} fill={b.f} />
            <ellipse cx={b.x - b.r * 0.35} cy={25 + b.len + b.r * 0.6} rx={b.r * 0.25} ry={b.r * 0.15} fill="white" opacity=".6" />
          </g>
        ))}

        {/* Arbolito */}
        <g transform="translate(372 40)">
          <path d="M44 0 L70 44 H56 L82 86 H64 L92 132 H-4 L24 86 H6 L32 44 H18 Z" fill="url(#tree)" />
          <rect x="36" y="132" width="16" height="16" rx="2" fill="#6b3f1d" />
          <path d="M44 -14 l4.4 9 9.8 1.4 -7.1 6.9 1.7 9.8 -8.8 -4.6 -8.8 4.6 1.7 -9.8 -7.1 -6.9 9.8 -1.4z" fill="#ffd54a" />
          {/* Guirnalda de luces */}
          <path d="M26 44 Q 46 58 64 46 M14 88 Q 46 104 76 88" stroke="#f4d58d" strokeWidth="1.6" fill="none" />
          {[[30, 48, "#ff5a5a"], [46, 54, "#ffd54a"], [60, 49, "#7fd3ff"], [20, 92, "#ffd54a"], [40, 99, "#ff5a5a"], [58, 98, "#7fd3ff"], [72, 92, "#ffd54a"], [34, 120, "#ff5a5a"], [58, 118, "#ffd54a"]].map(([cx, cy, c], i) => (
            <circle key={i} cx={cx as number} cy={cy as number} r="3.6" fill={c as string} />
          ))}
        </g>

        {/* Regalo */}
        <g transform="translate(300 150)">
          <rect x="0" y="14" width="58" height="46" rx="3" fill="url(#gift)" />
          <rect x="-4" y="6" width="66" height="14" rx="3" fill="#c81e2c" />
          <rect x="25" y="6" width="8" height="54" fill="#ffd54a" />
          <path d="M29 6 C 14 -8, 6 6, 29 6 C 52 -8, 44 6, 29 6" fill="none" stroke="#ffd54a" strokeWidth="5" strokeLinecap="round" />
        </g>
      </svg>
    </div>
  )
}
