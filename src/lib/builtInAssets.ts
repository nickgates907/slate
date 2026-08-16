import { Source } from '../store'

function svg(markup: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`
}

// ── Static overlay SVGs ───────────────────────────────────────────────────────
// Slate brand: #FF4D4D red (gradient to #cc2200 for depth), #0a0a14 / #0d0d13 dark
// neutrals. Anime-influenced treatment — speed lines, halftone texture, bold
// cel-shaded strokes — instead of a plain tech gradient.

// Reusable ingredients, inlined per-asset so each SVG stays self-contained.
function speedLines(cx: number, cy: number, rInner: number, rOuter: number, count: number, color: string, opacity: number) {
  let out = ''
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2
    const len = rOuter - rInner * (0.3 + 0.7 * ((i * 37) % 5) / 5)
    const x1 = cx + Math.cos(a) * rInner
    const y1 = cy + Math.sin(a) * rInner
    const x2 = cx + Math.cos(a) * (rInner + len)
    const y2 = cy + Math.sin(a) * (rInner + len)
    out += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${color}" stroke-width="1.4" stroke-opacity="${opacity}" stroke-linecap="round"/>`
  }
  return out
}

const HALFTONE_DEF = `
  <pattern id="halftone" width="10" height="10" patternUnits="userSpaceOnUse">
    <circle cx="2" cy="2" r="1.1" fill="#FF4D4D"/>
  </pattern>`

const FRAME_ROUND = svg(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <defs>
    <linearGradient id="a" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FF4D4D"/>
      <stop offset="100%" stop-color="#cc2200"/>
    </linearGradient>
    <filter id="a-glow"><feGaussianBlur stdDeviation="3" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  ${speedLines(100, 100, 100, 122, 16, '#FF4D4D', 0.4)}
  <circle cx="100" cy="100" r="97" fill="none" stroke="#0a0a14" stroke-width="8"/>
  <circle cx="100" cy="100" r="97" fill="none" stroke="url(#a)" stroke-width="5" filter="url(#a-glow)"/>
  <circle cx="100" cy="100" r="90" fill="none" stroke="white" stroke-opacity="0.12" stroke-width="0.8"/>
</svg>`)

const FRAME_GAMING = svg(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <defs>
    <linearGradient id="b" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FF4D4D"/>
      <stop offset="100%" stop-color="#cc2200"/>
    </linearGradient>
  </defs>
  <line x1="-14" y1="4" x2="-32" y2="-2" stroke="#FF4D4D" stroke-width="2" stroke-opacity="0.55"/>
  <line x1="-10" y1="14" x2="-30" y2="16" stroke="#FF4D4D" stroke-width="2" stroke-opacity="0.4"/>
  <line x1="214" y1="4" x2="232" y2="-2" stroke="#FF4D4D" stroke-width="2" stroke-opacity="0.55"/>
  <line x1="210" y1="14" x2="230" y2="16" stroke="#FF4D4D" stroke-width="2" stroke-opacity="0.4"/>
  <polygon points="22,0 178,0 200,22 200,178 178,200 22,200 0,178 0,22"
           fill="none" stroke="#0a0a14" stroke-width="7"/>
  <polygon points="22,0 178,0 200,22 200,178 178,200 22,200 0,178 0,22"
           fill="none" stroke="url(#b)" stroke-width="3"/>
  <polygon points="30,8 170,8 192,30 192,170 170,192 30,192 8,170 8,30"
           fill="none" stroke="#FF4D4D" stroke-width="0.8" stroke-opacity="0.3"/>
  <polyline points="0,44 0,0 44,0"   fill="none" stroke="#FF4D4D" stroke-width="5"/>
  <polyline points="156,0 200,0 200,44"  fill="none" stroke="#FF4D4D" stroke-width="5"/>
  <polyline points="200,156 200,200 156,200" fill="none" stroke="#FF4D4D" stroke-width="5"/>
  <polyline points="44,200 0,200 0,156"  fill="none" stroke="#FF4D4D" stroke-width="5"/>
</svg>`)

const FRAME_MINIMAL = svg(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <rect x="2" y="2" width="196" height="196" rx="16" ry="16"
        fill="none" stroke="white" stroke-width="2" stroke-opacity="0.55"/>
  <polyline points="0,32 0,0 32,0"    fill="none" stroke="#FF4D4D" stroke-width="4"/>
  <polyline points="168,0 200,0 200,32"   fill="none" stroke="#FF4D4D" stroke-width="4"/>
  <polyline points="200,168 200,200 168,200" fill="none" stroke="#FF4D4D" stroke-width="4"/>
  <polyline points="32,200 0,200 0,168"   fill="none" stroke="#FF4D4D" stroke-width="4"/>
</svg>`)

const LOWER_CLEAN = svg(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 80">
  <defs>
    <linearGradient id="c" x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
      <stop offset="0%" stop-color="#0a0a14" stop-opacity="0"/>
      <stop offset="100%" stop-color="#0a0a14" stop-opacity="0.92"/>
    </linearGradient>
    ${HALFTONE_DEF}
    <linearGradient id="c-mask" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-opacity="0"/>
      <stop offset="100%" stop-opacity="0.5"/>
    </linearGradient>
    <mask id="c-fade"><rect width="640" height="80" fill="url(#c-mask)"/></mask>
  </defs>
  <rect width="640" height="80" fill="url(#c)"/>
  <rect width="640" height="80" fill="url(#halftone)" mask="url(#c-fade)"/>
  <rect y="76" width="640" height="4" fill="#FF4D4D"/>
</svg>`)

const LOWER_ACCENT = svg(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 60">
  <rect width="640" height="60" fill="#0d0d13" fill-opacity="0.95"/>
  <polygon points="0,0 24,0 12,60 0,60" fill="#FF4D4D"/>
  <polygon points="24,0 32,0 20,60 12,60" fill="#FF4D4D" fill-opacity="0.4"/>
  <rect x="5" width="635" height="1" fill="#FF4D4D" fill-opacity="0.25"/>
  <rect x="5" y="59" width="635" height="1" fill="#FF4D4D" fill-opacity="0.25"/>
</svg>`)

const LOWER_NEON = svg(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 60">
  <defs>
    <linearGradient id="d" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%"  stop-color="#FF4D4D" stop-opacity="0.95"/>
      <stop offset="55%" stop-color="#1a0808" stop-opacity="0.95"/>
      <stop offset="100%" stop-color="#1a0808" stop-opacity="0"/>
    </linearGradient>
    <filter id="glow"><feGaussianBlur stdDeviation="2.5" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  <rect width="640" height="60" fill="url(#d)"/>
  <rect height="2.5" width="320" fill="#FF9494" filter="url(#glow)" opacity="0.9"/>
  <rect y="57.5" height="2.5" width="320" fill="#FF9494" filter="url(#glow)" opacity="0.5"/>
</svg>`)

const FS_STARTING = svg(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720">
  <defs>
    <radialGradient id="e" cx="50%" cy="50%" r="70%">
      <stop offset="0%" stop-color="#2a0d0d"/>
      <stop offset="100%" stop-color="#0a0a0f"/>
    </radialGradient>
    <linearGradient id="f" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#FF4D4D"/>
      <stop offset="100%" stop-color="#cc2200"/>
    </linearGradient>
    ${HALFTONE_DEF}
    <radialGradient id="e-mask" cx="50%" cy="50%" r="60%">
      <stop offset="0%" stop-opacity="0.35"/>
      <stop offset="100%" stop-opacity="0"/>
    </radialGradient>
    <mask id="e-fade"><rect width="1280" height="720" fill="url(#e-mask)"/></mask>
  </defs>
  <rect width="1280" height="720" fill="url(#e)"/>
  ${speedLines(640, 360, 130, 420, 40, '#FF4D4D', 0.22)}
  <rect width="1280" height="720" fill="url(#halftone)" mask="url(#e-fade)"/>
  <rect width="1280" height="4" fill="url(#f)"/>
  <rect y="716" width="1280" height="4" fill="url(#f)"/>
  <polyline points="0,60 0,0 60,0"         fill="none" stroke="#FF4D4D" stroke-width="3" stroke-opacity="0.6"/>
  <polyline points="1220,0 1280,0 1280,60" fill="none" stroke="#FF4D4D" stroke-width="3" stroke-opacity="0.6"/>
  <polyline points="1280,660 1280,720 1220,720" fill="none" stroke="#FF4D4D" stroke-width="3" stroke-opacity="0.6"/>
  <polyline points="60,720 0,720 0,660"    fill="none" stroke="#FF4D4D" stroke-width="3" stroke-opacity="0.6"/>
  <circle cx="640" cy="360" r="150" fill="none" stroke="#FF4D4D" stroke-width="1.5" stroke-opacity="0.4"/>
</svg>`)

const FS_BRB = svg(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720">
  <defs>
    <radialGradient id="g" cx="50%" cy="50%" r="70%">
      <stop offset="0%" stop-color="#15151d"/>
      <stop offset="100%" stop-color="#08080b"/>
    </radialGradient>
    <linearGradient id="h" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#FF4D4D"/>
      <stop offset="100%" stop-color="#cc2200"/>
    </linearGradient>
  </defs>
  <rect width="1280" height="720" fill="url(#g)"/>
  <rect width="1280" height="3" fill="url(#h)"/>
  <rect y="717" width="1280" height="3" fill="url(#h)"/>
  <circle cx="640" cy="360" r="140" fill="none" stroke="#3a2020" stroke-width="1.5"/>
  <circle cx="640" cy="360" r="180" fill="none" stroke="#3a2020" stroke-width="1"/>
  <circle cx="640" cy="360" r="220" fill="none" stroke="#3a2020" stroke-width="0.8" stroke-opacity="0.6"/>
  <circle cx="640" cy="360" r="6" fill="#FF4D4D" fill-opacity="0.8"/>
</svg>`)

const ALERT_CARD = svg(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 90">
  <defs>
    <linearGradient id="i" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#FF4D4D"/>
      <stop offset="100%" stop-color="#cc2200"/>
    </linearGradient>
    <filter id="sh">
      <feDropShadow dx="0" dy="6" stdDeviation="10" flood-color="#FF4D4D" flood-opacity="0.4"/>
    </filter>
  </defs>
  ${speedLines(0, 45, 6, 34, 10, '#FF4D4D', 0.5)}
  <rect rx="14" width="420" height="90" fill="#12121e" filter="url(#sh)"/>
  <rect rx="14" width="420" height="90" fill="none" stroke="url(#i)" stroke-width="1.5"/>
  <rect rx="14" width="5" height="90" fill="url(#i)"/>
</svg>`)

// ── Asset definitions ─────────────────────────────────────────────────────────

export interface BuiltInAsset {
  id: string
  name: string
  category: 'frame' | 'lowerthird' | 'fullscreen' | 'alert'
  src: string
  defaultW: number
  defaultH: number
}

export const builtInAssets: BuiltInAsset[] = [
  { id: 'frame-round',      name: 'Round Frame',       category: 'frame',      src: FRAME_ROUND,    defaultW: 140, defaultH: 140 },
  { id: 'frame-gaming',     name: 'Gaming Frame',      category: 'frame',      src: FRAME_GAMING,   defaultW: 140, defaultH: 140 },
  { id: 'frame-minimal',    name: 'Minimal Frame',     category: 'frame',      src: FRAME_MINIMAL,  defaultW: 140, defaultH: 140 },
  { id: 'lt-clean',         name: 'Lower Third',       category: 'lowerthird', src: LOWER_CLEAN,    defaultW: 640, defaultH: 80  },
  { id: 'lt-accent',        name: 'Lower Third Dark',  category: 'lowerthird', src: LOWER_ACCENT,   defaultW: 640, defaultH: 60  },
  { id: 'lt-neon',          name: 'Lower Third Neon',  category: 'lowerthird', src: LOWER_NEON,     defaultW: 640, defaultH: 60  },
  { id: 'fs-starting',      name: 'Starting Soon',     category: 'fullscreen', src: FS_STARTING,    defaultW: 640, defaultH: 360 },
  { id: 'fs-brb',           name: 'BRB Screen',        category: 'fullscreen', src: FS_BRB,         defaultW: 640, defaultH: 360 },
  { id: 'alert-card',       name: 'Alert Card',        category: 'alert',      src: ALERT_CARD,     defaultW: 320, defaultH: 70  },
]

export function assetToSource(asset: BuiltInAsset): Omit<Source, 'id'> {
  return {
    type: 'image',
    name: asset.name,
    visible: true,
    x: asset.category === 'fullscreen' ? 0 : 40,
    y: asset.category === 'lowerthird' ? 310 : asset.category === 'fullscreen' ? 0 : 40,
    width: asset.defaultW,
    height: asset.defaultH,
    imageSrc: asset.src,
  }
}
