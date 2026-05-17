import { useState } from 'react'

export default function SplashScreen({ onDone }: { onDone: () => void }) {
  const [fading, setFading] = useState(false)

  const handleLaunch = () => {
    setFading(true)
    setTimeout(onDone, 500)
  }

  return (
    <div
      onClick={handleLaunch}
      className={`fixed inset-0 flex flex-col items-center justify-center gap-4 cursor-pointer select-none transition-opacity duration-500 z-50 ${fading ? 'opacity-0' : 'opacity-100'}`}
      style={{ background: 'linear-gradient(160deg, #0d0d1f 0%, #1a0d2e 50%, #0d1a1f 100%)' }}
    >
      <svg width="96" height="96" viewBox="0 0 72 72" fill="none" style={{ filter: 'drop-shadow(0 0 24px rgba(255,77,77,0.6))' }}>
        <rect width="72" height="72" rx="18" fill="#FF4D4D"/>
        <circle cx="36" cy="36" r="17" stroke="white" strokeWidth="3" fill="none"/>
        <circle cx="36" cy="36" r="10" stroke="white" strokeWidth="2.5" fill="none"/>
        <circle cx="36" cy="36" r="4" fill="white"/>
        <circle cx="52" cy="20" r="5" fill="white"/>
        <circle cx="52" cy="20" r="2.5" fill="#FF4D4D"/>
      </svg>

      <div className="flex flex-col items-center gap-1">
        <span className="text-white text-4xl font-bold tracking-widest" style={{ textShadow: '0 0 32px rgba(255,77,77,0.5)' }}>Slate</span>
        <span className="text-white/40 text-xs tracking-widest">SIMPLE STREAMING FOR EVERYONE</span>
      </div>

      <p className="absolute bottom-8 text-white/25 text-xs tracking-widest animate-pulse">CLICK ANYWHERE TO LAUNCH</p>
    </div>
  )
}
