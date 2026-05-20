import { Source } from '../store'

function svg(markup: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`
}

// ── Static overlay SVGs ───────────────────────────────────────────────────────

const FRAME_ROUND = svg(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <defs>
    <linearGradient id="a" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#7c3aed"/>
      <stop offset="100%" stop-color="#db2777"/>
    </linearGradient>
  </defs>
  <circle cx="100" cy="100" r="97" fill="none" stroke="url(#a)" stroke-width="5"/>
  <circle cx="100" cy="100" r="91" fill="none" stroke="white" stroke-width="0.8" stroke-opacity="0.15"/>
</svg>`)

const FRAME_GAMING = svg(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <defs>
    <linearGradient id="b" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#06b6d4"/>
      <stop offset="100%" stop-color="#3b82f6"/>
    </linearGradient>
  </defs>
  <polygon points="22,0 178,0 200,22 200,178 178,200 22,200 0,178 0,22"
           fill="none" stroke="url(#b)" stroke-width="3"/>
  <polygon points="30,8 170,8 192,30 192,170 170,192 30,192 8,170 8,30"
           fill="none" stroke="#06b6d4" stroke-width="0.8" stroke-opacity="0.35"/>
  <polyline points="0,44 0,0 44,0"   fill="none" stroke="#06b6d4" stroke-width="5"/>
  <polyline points="156,0 200,0 200,44"  fill="none" stroke="#06b6d4" stroke-width="5"/>
  <polyline points="200,156 200,200 156,200" fill="none" stroke="#06b6d4" stroke-width="5"/>
  <polyline points="44,200 0,200 0,156"  fill="none" stroke="#06b6d4" stroke-width="5"/>
</svg>`)

const FRAME_MINIMAL = svg(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <rect x="2" y="2" width="196" height="196" rx="12" ry="12"
        fill="none" stroke="white" stroke-width="2" stroke-opacity="0.6"/>
  <polyline points="0,30 0,0 30,0"    fill="none" stroke="white" stroke-width="4"/>
  <polyline points="170,0 200,0 200,30"   fill="none" stroke="white" stroke-width="4"/>
  <polyline points="200,170 200,200 170,200" fill="none" stroke="white" stroke-width="4"/>
  <polyline points="30,200 0,200 0,170"   fill="none" stroke="white" stroke-width="4"/>
</svg>`)

const LOWER_CLEAN = svg(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 80">
  <defs>
    <linearGradient id="c" x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
      <stop offset="0%" stop-color="#000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0.88"/>
    </linearGradient>
  </defs>
  <rect width="640" height="80" fill="url(#c)"/>
  <rect y="76" width="640" height="4" fill="#7c3aed"/>
</svg>`)

const LOWER_ACCENT = svg(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 60">
  <rect width="640" height="60" fill="#111827" fill-opacity="0.92"/>
  <rect width="5" height="60" fill="#7c3aed"/>
  <rect x="5" width="635" height="1" fill="#7c3aed" fill-opacity="0.3"/>
  <rect x="5" y="59" width="635" height="1" fill="#7c3aed" fill-opacity="0.3"/>
</svg>`)

const LOWER_NEON = svg(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 60">
  <defs>
    <linearGradient id="d" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%"  stop-color="#7c3aed" stop-opacity="0.95"/>
      <stop offset="55%" stop-color="#1e1b4b" stop-opacity="0.95"/>
      <stop offset="100%" stop-color="#1e1b4b" stop-opacity="0"/>
    </linearGradient>
    <filter id="glow"><feGaussianBlur stdDeviation="2.5" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  <rect width="640" height="60" fill="url(#d)"/>
  <rect height="2.5" width="320" fill="#a78bfa" filter="url(#glow)" opacity="0.85"/>
  <rect y="57.5" height="2.5" width="320" fill="#a78bfa" filter="url(#glow)" opacity="0.5"/>
</svg>`)

const FS_STARTING = svg(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720">
  <defs>
    <radialGradient id="e" cx="50%" cy="50%" r="70%">
      <stop offset="0%" stop-color="#1e1b4b"/>
      <stop offset="100%" stop-color="#0a0a0f"/>
    </radialGradient>
    <linearGradient id="f" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#7c3aed"/>
      <stop offset="100%" stop-color="#db2777"/>
    </linearGradient>
  </defs>
  <rect width="1280" height="720" fill="url(#e)"/>
  <rect width="1280" height="4" fill="url(#f)"/>
  <rect y="716" width="1280" height="4" fill="url(#f)"/>
  <polyline points="0,60 0,0 60,0"         fill="none" stroke="#7c3aed" stroke-width="3" stroke-opacity="0.55"/>
  <polyline points="1220,0 1280,0 1280,60" fill="none" stroke="#7c3aed" stroke-width="3" stroke-opacity="0.55"/>
  <polyline points="1280,660 1280,720 1220,720" fill="none" stroke="#7c3aed" stroke-width="3" stroke-opacity="0.55"/>
  <polyline points="60,720 0,720 0,660"    fill="none" stroke="#7c3aed" stroke-width="3" stroke-opacity="0.55"/>
</svg>`)

const FS_BRB = svg(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720">
  <defs>
    <radialGradient id="g" cx="50%" cy="50%" r="70%">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#020617"/>
    </radialGradient>
    <linearGradient id="h" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#06b6d4"/>
      <stop offset="100%" stop-color="#3b82f6"/>
    </linearGradient>
  </defs>
  <rect width="1280" height="720" fill="url(#g)"/>
  <rect width="1280" height="3" fill="url(#h)"/>
  <rect y="717" width="1280" height="3" fill="url(#h)"/>
  <circle cx="640" cy="360" r="180" fill="none" stroke="#1e3a5f" stroke-width="1.5"/>
  <circle cx="640" cy="360" r="220" fill="none" stroke="#1e3a5f" stroke-width="0.8" stroke-opacity="0.5"/>
</svg>`)

const ALERT_CARD = svg(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 90">
  <defs>
    <linearGradient id="i" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#7c3aed"/>
      <stop offset="100%" stop-color="#db2777"/>
    </linearGradient>
    <filter id="sh">
      <feDropShadow dx="0" dy="6" stdDeviation="10" flood-color="#7c3aed" flood-opacity="0.35"/>
    </filter>
  </defs>
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
  { id: 'frame-round',   name: 'Round Frame',       category: 'frame',       src: FRAME_ROUND,   defaultW: 140, defaultH: 140 },
  { id: 'frame-gaming',  name: 'Gaming Frame',      category: 'frame',       src: FRAME_GAMING,  defaultW: 140, defaultH: 140 },
  { id: 'frame-minimal', name: 'Minimal Frame',     category: 'frame',       src: FRAME_MINIMAL, defaultW: 140, defaultH: 140 },
  { id: 'lt-clean',      name: 'Lower Third',       category: 'lowerthird',  src: LOWER_CLEAN,   defaultW: 640, defaultH: 80  },
  { id: 'lt-accent',     name: 'Lower Third Dark',  category: 'lowerthird',  src: LOWER_ACCENT,  defaultW: 640, defaultH: 60  },
  { id: 'lt-neon',       name: 'Lower Third Neon',  category: 'lowerthird',  src: LOWER_NEON,    defaultW: 640, defaultH: 60  },
  { id: 'fs-starting',   name: 'Starting Soon',     category: 'fullscreen',  src: FS_STARTING,   defaultW: 640, defaultH: 360 },
  { id: 'fs-brb',        name: 'BRB Screen',        category: 'fullscreen',  src: FS_BRB,        defaultW: 640, defaultH: 360 },
  { id: 'alert-card',    name: 'Alert Card',        category: 'alert',       src: ALERT_CARD,    defaultW: 320, defaultH: 70  },
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
