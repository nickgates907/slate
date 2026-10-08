// Shared Slate target-icon mark. Fills with a 5-stop gradient driven by
// --logo-stop-0..4 (set in src/lib/skins.ts) rather than a flat currentColor —
// for solid-color skins all 5 stops are just the accent color repeated, so it
// renders identically to a plain fill; only pattern skins (rainbow, tie-dye,
// camo) actually show a gradient here.
export default function SlateLogo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 72 72" fill="none">
      <defs>
        <linearGradient id="slate-logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: 'var(--logo-stop-0)' }} />
          <stop offset="25%" style={{ stopColor: 'var(--logo-stop-1)' }} />
          <stop offset="50%" style={{ stopColor: 'var(--logo-stop-2)' }} />
          <stop offset="75%" style={{ stopColor: 'var(--logo-stop-3)' }} />
          <stop offset="100%" style={{ stopColor: 'var(--logo-stop-4)' }} />
        </linearGradient>
      </defs>
      <rect width="72" height="72" rx="18" fill="url(#slate-logo-grad)"/>
      <circle cx="36" cy="36" r="17" stroke="white" strokeWidth="3" fill="none"/>
      <circle cx="36" cy="36" r="10" stroke="white" strokeWidth="2.5" fill="none"/>
      <circle cx="36" cy="36" r="4" fill="white"/>
      <circle cx="52" cy="20" r="5" fill="white"/>
      <circle cx="52" cy="20" r="2.5" fill="url(#slate-logo-grad)"/>
    </svg>
  )
}
