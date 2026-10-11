import { useState, useEffect } from 'react'
import { getVersion } from '@tauri-apps/api/app'
import SlateLogo from './SlateLogo'
import ConstellationField from './ConstellationField'

export default function SplashScreen({ onDone, skinId }: { onDone: () => void; skinId?: string }) {
  const [fading, setFading] = useState(false)
  const [version, setVersion] = useState('')
  const isMidnightSkies = skinId === 'midnight-skies'

  useEffect(() => { getVersion().then(setVersion).catch(() => {}) }, [])

  const handleLaunch = () => {
    setFading(true)
    setTimeout(onDone, 500)
  }

  return (
    <div
      onClick={handleLaunch}
      className={`fixed inset-0 flex flex-col items-center justify-center gap-4 cursor-pointer select-none transition-opacity duration-500 z-50 ${isMidnightSkies ? 'midnight-skies-bg' : ''} ${fading ? 'opacity-0' : 'opacity-100'}`}
      style={isMidnightSkies ? undefined : { background: 'linear-gradient(160deg, #0d0d1f 0%, #1a0d2e 50%, #0d1a1f 100%)' }}
    >
      {isMidnightSkies && <ConstellationField />}
      <div className="relative" style={{ filter: 'drop-shadow(0 0 24px rgb(var(--accent-rgb) / 0.6))' }}>
        <SlateLogo size={96} skinId={skinId} />
      </div>

      <div className="flex flex-col items-center gap-1">
        <span className="text-white text-4xl font-bold tracking-widest" style={{ textShadow: '0 0 32px rgb(var(--accent-rgb) / 0.5)' }}>Slate</span>
        <span className="text-white/40 text-xs tracking-widest">SIMPLE STREAMING FOR EVERYONE</span>
      </div>

      <p className="absolute bottom-8 text-white/25 text-xs tracking-widest animate-pulse">CLICK ANYWHERE TO LAUNCH</p>
      {version && <p className="absolute bottom-4 left-4 text-white/20 text-[10px] font-mono tracking-wider">v{version}</p>}
    </div>
  )
}
