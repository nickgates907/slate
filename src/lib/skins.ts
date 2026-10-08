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
  amber: { id: 'amber', name: 'Slate Amber', accent: '245 158 11', accentHover: '217 119 6', accentStrong: '180 83 9', fg: '10 14 20', premium: true, price: '$2.99' },
  rose: { id: 'rose', name: 'Slate Rose', accent: '244 63 94', accentHover: '225 29 72', accentStrong: '190 18 60', fg: '255 255 255', premium: true, price: '$2.99' },
  sapphire: { id: 'sapphire', name: 'Slate Sapphire', accent: '59 130 246', accentHover: '37 99 235', accentStrong: '29 78 216', fg: '255 255 255', premium: true, price: '$2.99' },
  emerald: { id: 'emerald', name: 'Slate Emerald', accent: '16 185 129', accentHover: '5 150 105', accentStrong: '4 120 87', fg: '255 255 255', premium: true, price: '$2.99' },
  sunset: { id: 'sunset', name: 'Slate Sunset', accent: '249 115 22', accentHover: '234 88 12', accentStrong: '194 65 12', fg: '255 255 255', premium: true, price: '$2.99' },
  maroon: { id: 'maroon', name: 'Aggie Maroon', accent: '80 0 0', accentHover: '61 0 0', accentStrong: '43 0 0', fg: '255 255 255', premium: true, price: '$2.99' },
  hunter: { id: 'hunter', name: 'Hunter Green', accent: '53 94 59', accentHover: '42 74 47', accentStrong: '31 55 35', fg: '255 255 255', premium: true, price: '$2.99' },
  pink: { id: 'pink', name: 'Slate Pink', accent: '236 72 153', accentHover: '219 39 119', accentStrong: '190 24 93', fg: '255 255 255', premium: true, price: '$2.99' },
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
}

export const DEFAULT_SKIN_ID = 'red'

export const FREE_SKIN_IDS = Object.values(SKINS).filter(s => !s.premium).map(s => s.id)
export const PREMIUM_SKIN_IDS = Object.values(SKINS).filter(s => s.premium).map(s => s.id)

export const BUNDLE_PRICE = '$9.99'
export const BUNDLE_CODE_ID = 'bundle'

// Dev builds (npm run tauri dev) unlock every skin automatically so they're easy to
// preview while working on them — only production builds actually enforce ownership.
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
}
