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

// ── Twitch channel panels (320×100) ──────────────────────────────────────────

// Slate brand colors: #FF4D4D red, #0d0d13 dark bg
function panel(title: string, iconPath: string): string {
  return svg(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 100">
  <defs>
    <linearGradient id="pg" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#111118"/>
      <stop offset="100%" stop-color="#0d0d13"/>
    </linearGradient>
    <linearGradient id="ra" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#FF4D4D"/>
      <stop offset="100%" stop-color="#cc2200"/>
    </linearGradient>
  </defs>
  <rect width="320" height="100" fill="url(#pg)"/>
  <rect y="93" width="320" height="7" fill="url(#ra)"/>
  <rect width="4" height="100" fill="url(#ra)"/>
  <rect x="4" y="0" width="316" height="1" fill="#FF4D4D" fill-opacity="0.25"/>
  <rect x="4" y="92" width="316" height="1" fill="#FF4D4D" fill-opacity="0.15"/>
  <g transform="translate(272,18)" fill="#FF4D4D" fill-opacity="0.5">${iconPath}</g>
  <text x="22" y="46" font-family="Arial,Helvetica,sans-serif" font-weight="700" font-size="20" fill="white">${title}</text>
  <text x="22" y="66" font-family="Arial,Helvetica,sans-serif" font-weight="400" font-size="10" fill="#FF4D4D" fill-opacity="0.7" letter-spacing="2">STREAMS WITH SLATE</text>
</svg>`)
}

const PANEL_ABOUT = panel('About Me',
  `<circle cx="24" cy="16" r="10"/><path d="M4,64 Q4,44 24,44 Q44,44 44,64" fill="#FF4D4D" fill-opacity="0.5"/>`)

const PANEL_SCHEDULE = panel('Schedule',
  `<rect width="44" height="44" rx="6" fill="none" stroke="#FF4D4D" stroke-width="2.5" stroke-opacity="0.5"/>
   <rect x="10" y="0" width="4" height="10" rx="2"/><rect x="30" y="0" width="4" height="10" rx="2"/>
   <rect x="4" y="14" width="36" height="2" fill-opacity="0.5"/>
   <rect x="8"  y="22" width="6" height="5" rx="1"/><rect x="19" y="22" width="6" height="5" rx="1"/><rect x="30" y="22" width="6" height="5" rx="1"/>
   <rect x="8"  y="32" width="6" height="5" rx="1"/><rect x="19" y="32" width="6" height="5" rx="1"/>`)

const PANEL_SUBSCRIBE = panel('Subscribe',
  `<path d="M22,8 C22,2 14,2 14,10 C14,18 22,26 22,26 C22,26 30,18 30,10 C30,2 22,2 22,8Z" fill-opacity="0.5"/>
   <path d="M4,30 L4,44 L40,44 L40,30 L22,36 Z" fill-opacity="0.4"/>`)

const PANEL_DISCORD = panel('Discord',
  `<path d="M36,6 C30,3 23,2 22,2 C21,2 14,3 8,6 C2,12 2,30 2,30 C6,36 14,38 22,38 C30,38 38,36 42,30 C42,30 42,12 36,6Z M16,26 C13,26 11,24 11,21 C11,18 13,16 16,16 C19,16 21,18 21,21 C21,24 19,26 16,26Z M28,26 C25,26 23,24 23,21 C23,18 25,16 28,16 C31,16 33,18 33,21 C33,24 31,26 28,26Z" fill-opacity="0.5"/>`)

const PANEL_DONATE = panel('Support Me',
  `<path d="M22,40 L6,24 C2,20 2,13 6,9 C10,5 16,5 20,9 L22,11 L24,9 C28,5 34,5 38,9 C42,13 42,20 38,24 Z" fill-opacity="0.5"/>`)

const PANEL_SETUP = panel('PC Setup',
  `<rect x="2" y="2" width="40" height="28" rx="3" fill="none" stroke="#FF4D4D" stroke-width="2.5" stroke-opacity="0.5"/>
   <rect x="8" y="8" width="28" height="16" rx="1" fill-opacity="0.3"/>
   <rect x="16" y="32" width="12" height="4" rx="1"/>
   <rect x="10" y="36" width="24" height="3" rx="1.5"/>`)

// ── Asset definitions ─────────────────────────────────────────────────────────

export interface BuiltInAsset {
  id: string
  name: string
  category: 'frame' | 'lowerthird' | 'fullscreen' | 'alert' | 'panel'
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
  { id: 'panel-about',      name: 'About Me',          category: 'panel',      src: PANEL_ABOUT,    defaultW: 320, defaultH: 100 },
  { id: 'panel-schedule',   name: 'Schedule',          category: 'panel',      src: PANEL_SCHEDULE, defaultW: 320, defaultH: 100 },
  { id: 'panel-subscribe',  name: 'Subscribe',         category: 'panel',      src: PANEL_SUBSCRIBE,defaultW: 320, defaultH: 100 },
  { id: 'panel-discord',    name: 'Discord',           category: 'panel',      src: PANEL_DISCORD,  defaultW: 320, defaultH: 100 },
  { id: 'panel-donate',     name: 'Support Me',        category: 'panel',      src: PANEL_DONATE,   defaultW: 320, defaultH: 100 },
  { id: 'panel-setup',      name: 'PC Setup',          category: 'panel',      src: PANEL_SETUP,    defaultW: 320, defaultH: 100 },
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
