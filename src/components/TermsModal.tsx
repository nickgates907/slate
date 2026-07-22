interface Props {
  onAccept: () => void
}

const POINTS = [
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-red">
        <path d="M12 2v20M2 12h20"/>
      </svg>
    ),
    text: 'Free forever — no subscription, no watermark, no catch',
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-red">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
    text: 'Anonymous crash reports only — no personal data, never sold',
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-red">
        <circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>
      </svg>
    ),
    text: 'You own your streams — Slate never touches your content',
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-red">
        <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>
      </svg>
    ),
    text: 'Comply with Twitch & YouTube rules when you stream',
  },
]

export default function TermsModal({ onAccept }: Props) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ background: '#0a0a14' }}
    >
      <div className="flex flex-col items-center w-full max-w-sm px-8">

        {/* Logo */}
        <div style={{ marginBottom: '1.75rem', position: 'relative' }}>
          <div style={{
            position: 'absolute', inset: '-12px',
            background: 'radial-gradient(circle, rgba(255,77,77,0.18) 0%, transparent 70%)',
            borderRadius: '50%',
          }} />
          <svg width="52" height="52" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="9" fill="#FF4D4D"/>
            <path d="M8 10h10a6 6 0 010 12H8V10z" fill="white"/>
          </svg>
        </div>

        <h1 className="font-bold text-white text-center" style={{ fontSize: '1.5rem', marginBottom: '0.35rem', letterSpacing: '-0.02em' }}>
          Welcome to Slate
        </h1>
        <p className="text-white/40" style={{ fontSize: '0.875rem', marginBottom: '2rem', textAlign: 'center' }}>
          Simple streaming for everyone
        </p>

        {/* Key points */}
        <div className="w-full flex flex-col gap-3.5" style={{ marginBottom: '2rem' }}>
          {POINTS.map((p, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">{p.icon}</div>
              <span className="text-white/60" style={{ fontSize: '0.85rem', lineHeight: '1.5' }}>{p.text}</span>
            </div>
          ))}
        </div>

        {/* Accept button */}
        <button
          onClick={onAccept}
          className="w-full rounded-xl font-semibold py-3 transition-opacity hover:opacity-90 active:opacity-75 bg-brand-red text-white"
          style={{ fontSize: '0.95rem' }}
        >
          Accept &amp; Get Started
        </button>

        {/* Legal footer */}
        <p className="text-white/25" style={{ fontSize: '0.75rem', marginTop: '1rem', textAlign: 'center', lineHeight: '1.5' }}>
          By continuing you agree to our{' '}
          <span className="text-white/45" style={{ textDecoration: 'underline' }}>
            Terms of Service
          </span>
          {' '}at slatestreaming.com/terms
        </p>

      </div>
    </div>
  )
}
