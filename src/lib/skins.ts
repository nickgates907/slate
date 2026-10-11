export interface Skin {
  id: string
  name: string
  accent: string        // "255 77 77" — space-separated RGB, matches --accent-rgb
  accentHover: string
  accentStrong: string
  fg: string             // text/icon color readable on top of a solid accent fill
  premium: boolean        // false = free forever, true = paid cosmetic unlock
  price?: string          // display price, only meaningful when premium is true
  gradient?: string       // optional full CSS gradient, overrides the default two-stop
                          // accent→hover gradient used for the active-scene highlight —
                          // only pattern skins use this; everything else still drives every
                          // other accent-colored surface in the app from the solid
                          // accent/accentHover/accentStrong values above
  logoStops?: string[]    // optional 5 hex colors for the Slate logo mark's gradient fill
                          // (SlateLogo.tsx) — omit to just fill solid with the accent color
}

export const SKINS: Record<string, Skin> = {
  red: { id: 'red', name: 'Slate Red', accent: '255 77 77', accentHover: '239 68 68', accentStrong: '224 48 48', fg: '255 255 255', premium: false },
  teal: { id: 'teal', name: 'Slate Teal', accent: '0 229 191', accentHover: '0 200 167', accentStrong: '0 122 104', fg: '10 14 20', premium: false },
  violet: { id: 'violet', name: 'Slate Violet', accent: '139 92 246', accentHover: '124 58 237', accentStrong: '109 40 217', fg: '255 255 255', premium: true, price: '$2.99' },
  'electric-orange': { id: 'electric-orange', name: 'Electric Orange', accent: '255 107 0', accentHover: '230 96 0', accentStrong: '191 80 0', fg: '255 255 255', premium: true, price: '$2.99' },
  'acid-lime': { id: 'acid-lime', name: 'Acid Lime', accent: '173 255 47', accentHover: '156 230 42', accentStrong: '130 191 35', fg: '10 14 20', premium: true, price: '$2.99' },
  'cyber-magenta': { id: 'cyber-magenta', name: 'Cyber Magenta', accent: '255 0 122', accentHover: '230 0 110', accentStrong: '191 0 92', fg: '255 255 255', premium: true, price: '$2.99' },
  sapphire: { id: 'sapphire', name: 'Slate Sapphire', accent: '59 130 246', accentHover: '37 99 235', accentStrong: '29 78 216', fg: '255 255 255', premium: true, price: '$2.99' },
  maroon: { id: 'maroon', name: 'Slate Maroon', accent: '80 0 0', accentHover: '61 0 0', accentStrong: '43 0 0', fg: '255 255 255', premium: true, price: '$2.99' },
  hunter: { id: 'hunter', name: 'Hunter Green', accent: '53 94 59', accentHover: '42 74 47', accentStrong: '31 55 35', fg: '255 255 255', premium: true, price: '$2.99' },
  rainbow: {
    id: 'rainbow', name: 'Rainbow', accent: '168 85 247', accentHover: '147 51 234', accentStrong: '126 34 206', fg: '255 255 255', premium: true, price: '$2.99',
    gradient: 'linear-gradient(90deg, #ff0040 0%, #ff8c00 20%, #ffee00 40%, #00c853 60%, #2979ff 80%, #aa00ff 100%)',
    logoStops: ['#ff0040', '#ffee00', '#00c853', '#2979ff', '#aa00ff'],
  },
  tiedye: {
    id: 'tiedye', name: 'Tie-Dye', accent: '236 0 140', accentHover: '204 0 120', accentStrong: '170 0 100', fg: '255 255 255', premium: true, price: '$2.99',
    gradient: 'radial-gradient(circle at 15% 25%, #ff0040 0%, transparent 38%), '
      + 'radial-gradient(circle at 78% 18%, #ffcc00 0%, transparent 38%), '
      + 'radial-gradient(circle at 85% 68%, #00e5ff 0%, transparent 38%), '
      + 'radial-gradient(circle at 22% 80%, #7c4dff 0%, transparent 38%), '
      + 'radial-gradient(circle at 55% 50%, #00e676 0%, transparent 32%)',
    logoStops: ['#ff0040', '#ffcc00', '#00e5ff', '#7c4dff', '#00e676'],
  },
  camo: {
    id: 'camo', name: 'Camo', accent: '75 83 32', accentHover: '59 66 25', accentStrong: '43 48 18', fg: '255 255 255', premium: true, price: '$2.99',
    gradient: 'radial-gradient(ellipse at 15% 20%, #4b5320 0%, transparent 32%), '
      + 'radial-gradient(ellipse at 65% 10%, #3b3c36 0%, transparent 36%), '
      + 'radial-gradient(ellipse at 85% 55%, #78866b 0%, transparent 32%), '
      + 'radial-gradient(ellipse at 25% 75%, #5c4033 0%, transparent 36%), '
      + 'radial-gradient(ellipse at 70% 85%, #4b5320 0%, transparent 32%), '
      + '#3b3c36',
    logoStops: ['#4b5320', '#3b3c36', '#78866b', '#5c4033', '#4b5320'],
  },
  'holiday-christmas': {
    id: 'holiday-christmas', name: 'Yule Glow', accent: '255 30 67', accentHover: '230 20 55', accentStrong: '191 15 46', fg: '255 255 255', premium: true, price: '$2.99',
    gradient: 'linear-gradient(135deg, #FF1E43 0%, #00C853 50%, #FFD700 100%)',
    logoStops: ['#FF1E43', '#00C853', '#FFD700', '#00C853', '#FF1E43'],
  },
  'holiday-halloween': {
    id: 'holiday-halloween', name: 'Spooky Night', accent: '255 102 0', accentHover: '230 92 0', accentStrong: '191 77 0', fg: '255 255 255', premium: true, price: '$2.99',
    gradient: 'linear-gradient(135deg, #FF6600 0%, #9D00FF 50%, #120A1A 100%)',
    logoStops: ['#FF6600', '#9D00FF', '#120A1A', '#9D00FF', '#FF6600'],
  },
  // Highest-tier skin — priced above the standard $2.99 premium skins.
  // Starlight purple primary / nebula pink secondary / celestial gold highlight.
  'midnight-skies': {
    id: 'midnight-skies', name: 'Midnight Skies', accent: '162 155 254', accentHover: '138 128 240', accentStrong: '110 98 212', fg: '255 255 255', premium: true, price: '$4.99',
    gradient: 'linear-gradient(90deg, #A29BFE 0%, #FD79A8 100%)',
    logoStops: ['#A29BFE', '#FD79A8', '#FFEAA7', '#FD79A8', '#A29BFE'],
  },
}

export const DEFAULT_SKIN_ID = 'red'

export const FREE_SKIN_IDS = Object.values(SKINS).filter(s => !s.premium).map(s => s.id)
export const PREMIUM_SKIN_IDS = Object.values(SKINS).filter(s => s.premium).map(s => s.id)

export const BUNDLE_PRICE = '$9.99'
export const BUNDLE_CODE_ID = 'bundle'

// Dev builds (npm run tauri dev) unlock every skin automatically so they're
// easy to preview while working on them — only production builds actually
// enforce ownership + the machine-bound signature check in store.ts.
export function isSkinOwned(skin: Skin, ownedSkins: string[]): boolean {
  if (!skin.premium) return true
  if (import.meta.env.DEV) return true
  return ownedSkins.includes(skin.id)
}

export function applySkin(skinId: string): void {
  const skin = SKINS[skinId] ?? SKINS[DEFAULT_SKIN_ID]
  const root = document.documentElement.style
  root.setProperty('--accent-rgb', skin.accent)
  root.setProperty('--accent-hover-rgb', skin.accentHover)
  root.setProperty('--accent-strong-rgb', skin.accentStrong)
  root.setProperty('--accent-fg-rgb', skin.fg)
  root.setProperty('--accent-gradient', skin.gradient ?? `linear-gradient(90deg, rgb(${skin.accent}) 0%, rgb(${skin.accentHover}) 100%)`)
  const logoStops = skin.logoStops ?? [`rgb(${skin.accent})`, `rgb(${skin.accent})`]
  for (let i = 0; i < 5; i++) {
    root.setProperty(`--logo-stop-${i}`, logoStops[i % logoStops.length])
  }

  // Every skin besides Midnight Skies just recolors accents and leaves the
  // normal dark-mode panel surfaces alone — this is the one flagship
  // exception with its own deep-violet "deep space" panel treatment.
  if (skinId === 'midnight-skies') {
    root.setProperty('--surface-dark-base-rgb', '10 7 19')
    root.setProperty('--surface-dark-panel-rgb', '18 13 35')
    root.setProperty('--surface-dark-card-rgb', '26 19 51')
    root.setProperty('--surface-dark-card-hover-rgb', '34 26 61')
    root.setProperty('--panel-border-color', 'rgba(162, 155, 254, 0.25)')
  } else {
    root.setProperty('--surface-dark-base-rgb', '10 14 20')
    root.setProperty('--surface-dark-panel-rgb', '18 24 34')
    root.setProperty('--surface-dark-card-rgb', '24 32 46')
    root.setProperty('--surface-dark-card-hover-rgb', '31 43 62')
    root.setProperty('--panel-border-color', 'rgba(255, 255, 255, 0.08)')
  }
}
