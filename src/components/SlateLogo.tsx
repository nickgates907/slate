import santaHatUrl from '../assets/santa-hat.png'

// Shared Slate target-icon mark. Fills with a 5-stop gradient driven by
// --logo-stop-0..4 (set in src/lib/skins.ts) rather than a flat currentColor —
// for solid-color skins all 5 stops are just the accent color repeated, so it
// renders identically to a plain fill; only pattern skins (rainbow, tie-dye,
// camo, holiday) actually show a gradient here. The two holiday skins also
// swap in seasonal artwork: a pumpkin silhouette for Halloween, and a real
// Santa hat image perched on the normal mark for Christmas (santa-hat.png —
// a user-supplied illustration, chroma-keyed to transparent and cropped).
const SANTA_HAT_ASPECT = 860 / 747 // source image is 747x860px

export default function SlateLogo({ size = 28, skinId }: { size?: number; skinId?: string }) {
  const gradDefs = (
    <defs>
      <linearGradient id="slate-logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: 'var(--logo-stop-0)' }} />
        <stop offset="25%" style={{ stopColor: 'var(--logo-stop-1)' }} />
        <stop offset="50%" style={{ stopColor: 'var(--logo-stop-2)' }} />
        <stop offset="75%" style={{ stopColor: 'var(--logo-stop-3)' }} />
        <stop offset="100%" style={{ stopColor: 'var(--logo-stop-4)' }} />
      </linearGradient>
    </defs>
  )

  if (skinId === 'holiday-halloween') {
    return (
      <svg width={size} height={size} viewBox="0 0 72 72" fill="none" style={{ overflow: 'visible' }}>
        <defs>
          <radialGradient id="pumpkin-glow" cx="50%" cy="50%" r="55%">
            <stop offset="0%" stopColor="#FFF4C2" />
            <stop offset="35%" stopColor="#FFB347" />
            <stop offset="100%" stopColor="#E8650C" />
          </radialGradient>
          <filter id="pumpkin-blur" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="2" />
          </filter>
        </defs>
        {/* Stem — a thick dark outline separates it from the body so it reads
            clearly as a stem rather than blending into the pumpkin's edge. */}
        <path d="M30 2 Q28 -4 34 -5 Q40 -6 39 0 Q38 5 32 6 Z" fill="#4B5320" stroke="#241C06" strokeWidth="1.6" strokeLinejoin="round" />
        {/* Pumpkin body — same rounded-square tile as the normal mark, with a
            thick dark outline so the whole silhouette reads as a carved
            jack-o'-lantern rather than a plain colored tile. */}
        <rect width="72" height="72" rx="18" fill="#E8650C" stroke="#3A1A02" strokeWidth="3" />
        <rect width="72" height="72" rx="18" fill="url(#pumpkin-glow)" opacity="0.4" />
        {/* Carved grooves — dark rings tracing the normal target-icon shape */}
        <circle cx="36" cy="36" r="17" stroke="#3A1A02" strokeWidth="4" fill="none" />
        <circle cx="36" cy="36" r="10" stroke="#3A1A02" strokeWidth="3.5" fill="none" />
        <circle cx="36" cy="36" r="4.5" fill="#3A1A02" />
        <circle cx="52" cy="20" r="5" fill="#3A1A02" />
        {/* Warm light glowing through the carved grooves */}
        <circle cx="36" cy="36" r="17" stroke="#FFD27A" strokeWidth="1.6" fill="none" filter="url(#pumpkin-blur)" />
        <circle cx="36" cy="36" r="10" stroke="#FFD27A" strokeWidth="1.6" fill="none" filter="url(#pumpkin-blur)" />
        <circle cx="36" cy="36" r="3" fill="#FFF4C2" filter="url(#pumpkin-blur)" />
        <circle cx="52" cy="20" r="2.2" fill="#FFF4C2" filter="url(#pumpkin-blur)" />
      </svg>
    )
  }

  if (skinId === 'midnight-skies') {
    const glow = size * 0.4
    return (
      <span
        style={{
          position: 'relative',
          display: 'inline-block',
          width: size,
          height: size,
          borderRadius: size * 0.25,
          boxShadow: `0 0 ${glow}px rgba(162, 155, 254, 0.45)`,
        }}
      >
        <svg width={size} height={size} viewBox="0 0 72 72" fill="none">
          <defs>
            <radialGradient id="nebula-grad" cx="30%" cy="30%" r="90%">
              <stop offset="0%" stopColor="#4A2E80" />
              <stop offset="40%" stopColor="#1D1145" />
              <stop offset="90%" stopColor="#0A0612" />
            </radialGradient>
          </defs>
          {/* Nebula tile — a starry space texture instead of the flat skin gradient */}
          <rect width="72" height="72" rx="18" fill="url(#nebula-grad)" />
          <circle cx="12" cy="14" r="0.9" fill="white" opacity="0.8" />
          <circle cx="58" cy="10" r="0.7" fill="white" opacity="0.6" />
          <circle cx="64" cy="52" r="0.8" fill="white" opacity="0.7" />
          <circle cx="18" cy="62" r="0.6" fill="#A29BFE" opacity="0.7" />
          <circle cx="44" cy="8" r="0.6" fill="#A29BFE" opacity="0.6" />
          <circle cx="8" cy="40" r="0.7" fill="white" opacity="0.5" />
          {/* Target rings — dark charcoal so the nebula shows through the cutouts
              between them, rather than covering it with a solid color. */}
          <circle cx="36" cy="36" r="17" stroke="#120B20" strokeWidth="3" fill="none" />
          <circle cx="36" cy="36" r="10" stroke="#120B20" strokeWidth="2.5" fill="none" />
          <circle cx="36" cy="36" r="4" fill="#FFEAA7" />
          <circle cx="52" cy="20" r="5" fill="#120B20" />
          <circle cx="52" cy="20" r="2.2" fill="white" />
          {/* Faint constellation lines connecting the star cluster */}
          <path d="M14 56 L22 48 L10 46" stroke="white" strokeOpacity="0.3" strokeWidth="0.8" fill="none" />
          {/* Star cluster, bottom-left corner */}
          <path d="M14 50 L16 54 L20 56 L16 58 L14 62 L12 58 L8 56 L12 54 Z" fill="#FFD700" />
          <path d="M22 44.5 L23.2 46.8 L25.5 48 L23.2 49.2 L22 51.5 L20.8 49.2 L18.5 48 L20.8 46.8 Z" fill="white" />
          <path d="M10 43.5 L10.9 45.1 L12.5 46 L10.9 46.9 L10 48.5 L9.1 46.9 L7.5 46 L9.1 45.1 Z" fill="white" />
        </svg>
      </span>
    )
  }

  const hatWidth = size * 0.9

  return (
    <span style={{ position: 'relative', display: 'inline-block', width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 72 72" fill="none">
        {gradDefs}
        <rect width="72" height="72" rx="18" fill="url(#slate-logo-grad)" />
        <circle cx="36" cy="36" r="17" stroke="white" strokeWidth="3" fill="none" />
        <circle cx="36" cy="36" r="10" stroke="white" strokeWidth="2.5" fill="none" />
        <circle cx="36" cy="36" r="4" fill="white" />
        <circle cx="52" cy="20" r="5" fill="white" />
        <circle cx="52" cy="20" r="2.5" fill="url(#slate-logo-grad)" />
      </svg>
      {skinId === 'holiday-christmas' && (
        <img
          src={santaHatUrl}
          alt=""
          style={{
            position: 'absolute',
            top: -size * 0.1,
            left: size * 0.33,
            width: hatWidth,
            height: hatWidth * SANTA_HAT_ASPECT,
            pointerEvents: 'none',
          }}
        />
      )}
    </span>
  )
}
