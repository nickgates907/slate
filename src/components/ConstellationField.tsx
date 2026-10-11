// Decorative constellation clusters scattered across a background — used by
// the Midnight Skies skin wherever there's open space to fill: the splash
// screen and the main app shell behind the panels. Five real constellations
// (Ursa Major, Cassiopeia, Orion, Cygnus, Pegasus), simplified but
// recognizable. Each one's brightest/anchor star(s) use the same 4-point
// sparkle shape and gold color as the logo's own star cluster
// (SlateLogo.tsx) with a soft glow, so the two read as one consistent motif;
// secondary stars stay smaller white or lavender dots for visual hierarchy.
// -z-10 keeps this behind the (plain, non-positioned) panel content it sits
// under — an absolutely-positioned element otherwise paints above static
// siblings regardless of DOM order.
export function sparklePath(cx: number, cy: number, r: number): string {
  const ir = r * 0.3
  return `M${cx} ${cy - r} L${cx + ir} ${cy - ir} L${cx + r} ${cy} L${cx + ir} ${cy + ir} L${cx} ${cy + r} L${cx - ir} ${cy + ir} L${cx - r} ${cy} L${cx - ir} ${cy - ir} Z`
}

interface Star { x: number; y: number; r: number; alpha?: boolean; color?: string }
interface Constellation { stars: Star[]; edges: Array<[number, number]> }

const CONSTELLATIONS: Constellation[] = [
  // Ursa Major — the Big Dipper/Plough asterism. Dubhe is the pointer star.
  {
    stars: [
      { x: 40, y: 55, r: 6, alpha: true },   // Dubhe
      { x: 70, y: 50, r: 3.5 },               // Merak
      { x: 85, y: 72, r: 3 },                 // Phecda
      { x: 62, y: 88, r: 3 },                 // Megrez
      { x: 95, y: 98, r: 3.5 },               // Alioth
      { x: 130, y: 108, r: 3 },               // Mizar
      { x: 162, y: 92, r: 3.5 },              // Alkaid
    ],
    edges: [[0, 1], [1, 2], [2, 3], [3, 0], [3, 4], [4, 5], [5, 6]],
  },
  // Cassiopeia — the W. Schedar is the anchor.
  {
    stars: [
      { x: 885, y: 45, r: 3.5 },              // Caph
      { x: 915, y: 60, r: 6, alpha: true },   // Schedar
      { x: 935, y: 32, r: 3.5 },              // Gamma Cas
      { x: 960, y: 55, r: 3.5 },              // Ruchbah
      { x: 990, y: 28, r: 3 },                // Segin
    ],
    edges: [[0, 1], [1, 2], [2, 3], [3, 4]],
  },
  // Orion — belt + shoulders + feet. Betelgeuse and Rigel are both gold.
  {
    stars: [
      { x: 25, y: 485, r: 3.5 },              // Bellatrix
      { x: 80, y: 480, r: 6, alpha: true },   // Betelgeuse
      { x: 42, y: 508, r: 3 },                // Belt (Mintaka)
      { x: 58, y: 513, r: 3 },                // Belt (Alnilam)
      { x: 74, y: 518, r: 3 },                // Belt (Alnitak)
      { x: 30, y: 552, r: 5.5, alpha: true }, // Rigel
      { x: 88, y: 557, r: 3.5 },              // Saiph
    ],
    edges: [[0, 1], [0, 2], [1, 4], [2, 3], [3, 4], [2, 5], [4, 6]],
  },
  // Cygnus — the Northern Cross. Deneb is the tail/anchor.
  {
    stars: [
      { x: 915, y: 485, r: 6, alpha: true },  // Deneb
      { x: 905, y: 510, r: 3 },               // Sadr
      { x: 895, y: 545, r: 3.5 },             // Albireo
      { x: 875, y: 500, r: 3 },               // Gienah
      { x: 935, y: 502, r: 3 },               // Delta Cygni
    ],
    edges: [[0, 1], [1, 2], [3, 1], [1, 4]],
  },
  // Pegasus — the Great Square. Markab is the anchor.
  {
    stars: [
      { x: 470, y: 55, r: 5, alpha: true },   // Markab
      { x: 465, y: 28, r: 3.5 },              // Scheat
      { x: 530, y: 25, r: 3.5 },              // Algenib
      { x: 525, y: 52, r: 3.5 },              // Alpheratz
    ],
    edges: [[0, 1], [1, 2], [2, 3], [3, 0]],
  },
  // Lyra — Vega (one of the brightest stars in the sky) anchoring a small
  // parallelogram. Placed in the mid-left gap between Ursa Major and Orion.
  {
    stars: [
      { x: 30, y: 250, r: 6, alpha: true },   // Vega
      { x: 15, y: 290, r: 3 },                // Sheliak
      { x: 45, y: 285, r: 3 },                // Sulafat
      { x: 50, y: 310, r: 2.5 },
      { x: 20, y: 315, r: 2.5 },
    ],
    edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 1]],
  },
]

export default function ConstellationField() {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none -z-10"
      viewBox="0 0 1000 600"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
    >
      <defs>
        <filter id="const-gold-glow" x="-80%" y="-80%" width="260%" height="260%">
          <feDropShadow dx="0" dy="0" stdDeviation="2.2" floodColor="#FFEAA7" floodOpacity="0.8" />
        </filter>
      </defs>
      {CONSTELLATIONS.map((c, ci) => (
        <g key={ci} opacity="0.65">
          {c.edges.map(([a, b], ei) => (
            <line
              key={ei}
              x1={c.stars[a].x} y1={c.stars[a].y}
              x2={c.stars[b].x} y2={c.stars[b].y}
              stroke="#A29BFE" strokeWidth="0.8" strokeOpacity="0.35"
            />
          ))}
          {c.stars.map((s, si) => {
            const idx = ci * 7 + si
            return (
              <path
                key={si}
                d={sparklePath(s.x, s.y, s.r)}
                fill={s.alpha ? '#FFEAA7' : (si % 3 === 0 ? '#A29BFE' : 'white')}
                filter={s.alpha ? 'url(#const-gold-glow)' : undefined}
                className="animate-twinkle"
                style={{
                  transformBox: 'fill-box',
                  transformOrigin: 'center',
                  animationDelay: `${(idx * 0.37) % 3}s`,
                  animationDuration: `${2 + (idx % 3) * 0.6}s`,
                }}
              />
            )
          })}
        </g>
      ))}
    </svg>
  )
}
