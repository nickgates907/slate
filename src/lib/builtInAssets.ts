import { Source } from '../store'

function svg(markup: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`
}

// ── Static overlay SVGs ───────────────────────────────────────────────────────
// Slate brand: #00E5BF teal (gradient to #00A88F for depth), #0A0E14 / #06090E
// dark neutrals. Clean HUD/tech treatment — dashed rings, soft glow filters,
// chamfered corner brackets — matching the app's Modern Dynamic theme.

const FRAME_ROUND = svg(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <defs>
    <linearGradient id="a" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00E5BF"/>
      <stop offset="100%" stop-color="#00A88F"/>
    </linearGradient>
    <filter id="a-glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="3" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <circle cx="100" cy="100" r="90" stroke="rgba(0,229,191,0.25)" stroke-width="1" fill="none" stroke-dasharray="4 2"/>
  <circle cx="100" cy="100" r="85" stroke="url(#a)" stroke-width="2.5" fill="none" filter="url(#a-glow)"/>
  <circle cx="100" cy="100" r="81" stroke="white" stroke-opacity="0.35" stroke-width="0.8" fill="none"/>
  <path d="M 94 11 L 106 11" stroke="#00E5BF" stroke-width="2" stroke-linecap="round"/>
  <path d="M 94 189 L 106 189" stroke="#00E5BF" stroke-width="2" stroke-linecap="round"/>
</svg>`)

const FRAME_GAMING = svg(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <defs>
    <linearGradient id="b" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#00E5BF"/>
      <stop offset="100%" stop-color="#009980"/>
    </linearGradient>
  </defs>
  <polygon points="26,0 174,0 200,26 200,174 174,200 26,200 0,174 0,26"
           fill="none" stroke="#0A0E14" stroke-width="7"/>
  <polygon points="26,0 174,0 200,26 200,174 174,200 26,200 0,174 0,26"
           fill="none" stroke="url(#b)" stroke-width="3"/>
  <polyline points="0,44 0,0 44,0"   fill="none" stroke="#00E5BF" stroke-width="5"/>
  <polyline points="156,0 200,0 200,44"  fill="none" stroke="#00E5BF" stroke-width="5"/>
  <polyline points="200,156 200,200 156,200" fill="none" stroke="#00E5BF" stroke-width="5"/>
  <polyline points="44,200 0,200 0,156"  fill="none" stroke="#00E5BF" stroke-width="5"/>
  <rect x="85" y="0" width="30" height="8" rx="4" fill="#00E5BF"/>
</svg>`)

const FRAME_MINIMAL = svg(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <rect x="2" y="2" width="196" height="196" rx="16" ry="16"
        fill="none" stroke="white" stroke-width="2" stroke-opacity="0.45"/>
  <rect x="2" y="2" width="196" height="196" rx="16" ry="16"
        fill="none" stroke="#00E5BF" stroke-width="1.5" stroke-dasharray="20 40"/>
  <polyline points="0,32 0,0 32,0"    fill="none" stroke="#00E5BF" stroke-width="4"/>
  <polyline points="168,0 200,0 200,32"   fill="none" stroke="#00E5BF" stroke-width="4"/>
  <polyline points="200,168 200,200 168,200" fill="none" stroke="#00E5BF" stroke-width="4"/>
  <polyline points="32,200 0,200 0,168"   fill="none" stroke="#00E5BF" stroke-width="4"/>
</svg>`)

const LOWER_CLEAN = svg(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 80">
  <defs>
    <linearGradient id="c" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#121822" stop-opacity="0"/>
      <stop offset="100%" stop-color="#121822" stop-opacity="0.95"/>
    </linearGradient>
  </defs>
  <rect width="640" height="80" fill="url(#c)"/>
  <rect x="1" y="1" width="638" height="78" rx="10" fill="#141C28" stroke="rgba(0,229,191,0.3)" stroke-width="1"/>
  <path d="M 0 0 L 10 0 L 10 80 L 0 80 Z" fill="#00E5BF"/>
  <rect x="28" y="24" width="180" height="14" rx="4" fill="#FFFFFF"/>
  <rect x="28" y="46" width="110" height="10" rx="3" fill="#7F93A8"/>
</svg>`)

const LOWER_ACCENT = svg(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 60">
  <path d="M 0 0 L 600 0 L 640 60 L 0 60 Z" fill="#121822" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
  <line x1="0" y1="0" x2="600" y2="0" stroke="#00E5BF" stroke-width="3"/>
  <rect x="30" y="20" width="190" height="16" rx="4" fill="#FFFFFF"/>
</svg>`)

const LOWER_NEON = svg(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 60">
  <defs>
    <linearGradient id="d" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#00E5BF" stop-opacity="0.95"/>
      <stop offset="55%" stop-color="#0A0E14" stop-opacity="0.95"/>
      <stop offset="100%" stop-color="#0A0E14" stop-opacity="0"/>
    </linearGradient>
    <filter id="glow"><feGaussianBlur stdDeviation="2.5" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  <rect width="640" height="60" fill="url(#d)"/>
  <rect height="2.5" width="320" fill="#6FF5DC" filter="url(#glow)" opacity="0.9"/>
  <rect y="57.5" height="2.5" width="320" fill="#6FF5DC" filter="url(#glow)" opacity="0.5"/>
</svg>`)

const FS_STARTING = svg(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720">
  <defs>
    <radialGradient id="e" cx="50%" cy="50%" r="70%">
      <stop offset="0%" stop-color="#0F1B26"/>
      <stop offset="100%" stop-color="#06090E"/>
    </radialGradient>
  </defs>
  <rect width="1280" height="720" fill="url(#e)"/>
  <circle cx="640" cy="360" r="240" stroke="rgba(0,229,191,0.15)" stroke-width="1" fill="none"/>
  <circle cx="640" cy="360" r="160" stroke="rgba(0,229,191,0.3)" stroke-width="1" stroke-dasharray="3 3" fill="none"/>
  <circle cx="640" cy="360" r="80" stroke="#00E5BF" stroke-width="1.5" fill="none"/>
  <line x1="160" y1="80" x2="1120" y2="640" stroke="rgba(0,229,191,0.08)" stroke-width="1"/>
  <line x1="1120" y1="80" x2="160" y2="640" stroke="rgba(0,229,191,0.08)" stroke-width="1"/>
  <rect width="1280" height="4" fill="#00E5BF"/>
  <rect y="716" width="1280" height="4" fill="#00E5BF"/>
  <rect x="416" y="544" width="448" height="48" rx="24" fill="#00E5BF"/>
</svg>`)

const FS_BRB = svg(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720">
  <defs>
    <radialGradient id="g" cx="50%" cy="50%" r="70%">
      <stop offset="0%" stop-color="#121822"/>
      <stop offset="100%" stop-color="#06090E"/>
    </radialGradient>
  </defs>
  <rect width="1280" height="720" fill="url(#g)"/>
  <rect width="1280" height="3" fill="#00E5BF"/>
  <rect y="717" width="1280" height="3" fill="#00E5BF"/>
  <circle cx="640" cy="360" r="256" stroke="rgba(0,229,191,0.1)" stroke-width="1" fill="none"/>
  <circle cx="640" cy="360" r="176" stroke="rgba(0,229,191,0.25)" stroke-width="1" fill="none"/>
  <circle cx="640" cy="360" r="96" stroke="rgba(0,229,191,0.5)" stroke-width="1" fill="none"/>
  <circle cx="640" cy="360" r="24" fill="#00E5BF"/>
</svg>`)

const ALERT_CARD = svg(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 90">
  <defs>
    <filter id="sh" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="0" stdDeviation="8" flood-color="#00E5BF" flood-opacity="0.35"/>
    </filter>
  </defs>
  <rect x="24" y="10" width="372" height="70" rx="14" fill="#121822" stroke="#00E5BF" stroke-width="1.5" filter="url(#sh)"/>
  <circle cx="60" cy="45" r="18" fill="rgba(0,229,191,0.2)"/>
  <circle cx="60" cy="45" r="9" fill="#00E5BF"/>
  <rect x="92" y="28" width="150" height="14" rx="4" fill="#FFFFFF"/>
  <rect x="92" y="50" width="100" height="10" rx="3" fill="#7F93A8"/>
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
