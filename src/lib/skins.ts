export interface Skin {
  id: string
  name: string
  accent: string        // "255 77 77" — space-separated RGB, matches --accent-rgb
  accentHover: string
  accentStrong: string
  fg: string             // text/icon color readable on top of a solid accent fill
  premium: boolean        // false = free forever, true = paid cosmetic unlock
  price?: string          // display price, only meaningful when premium is true
}

export const SKINS: Record<string, Skin> = {
  teal: { id: 'teal', name: 'Slate Teal', accent: '0 229 191', accentHover: '0 200 167', accentStrong: '0 122 104', fg: '10 14 20', premium: false },
  red: { id: 'red', name: 'Slate Red', accent: '255 77 77', accentHover: '239 68 68', accentStrong: '224 48 48', fg: '255 255 255', premium: false },
  violet: { id: 'violet', name: 'Slate Violet', accent: '139 92 246', accentHover: '124 58 237', accentStrong: '109 40 217', fg: '255 255 255', premium: true, price: '$2.99' },
  amber: { id: 'amber', name: 'Slate Amber', accent: '245 158 11', accentHover: '217 119 6', accentStrong: '180 83 9', fg: '10 14 20', premium: true, price: '$2.99' },
}

export const DEFAULT_SKIN_ID = 'teal'

export const FREE_SKIN_IDS = Object.values(SKINS).filter(s => !s.premium).map(s => s.id)

export function applySkin(skinId: string): void {
  const skin = SKINS[skinId] ?? SKINS[DEFAULT_SKIN_ID]
  const root = document.documentElement.style
  root.setProperty('--accent-rgb', skin.accent)
  root.setProperty('--accent-hover-rgb', skin.accentHover)
  root.setProperty('--accent-strong-rgb', skin.accentStrong)
  root.setProperty('--accent-fg-rgb', skin.fg)
}
