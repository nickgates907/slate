import { useState } from 'react'

interface Props {
  onAccept: () => void
}

export default function TermsModal({ onAccept }: Props) {
  const [checked, setChecked] = useState(false)

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center"
      style={{ background: '#0a0a14' }}
    >
      <div className="flex flex-col items-center w-full max-w-lg px-6" style={{ maxHeight: '100vh' }}>

        {/* Logo + heading */}
        <div className="flex items-center gap-2.5 mb-6">
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="8" fill="#FF4D4D"/>
            <path d="M8 10h10a6 6 0 010 12H8V10z" fill="white"/>
          </svg>
          <span className="font-bold text-white text-xl tracking-tight">Slate</span>
        </div>

        <h1 className="font-bold text-white text-xl mb-1 text-center">Terms of Service</h1>
        <p className="text-center mb-5" style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.825rem' }}>
          Please read and accept before continuing
        </p>

        {/* Scrollable terms */}
        <div
          className="w-full rounded-2xl overflow-y-auto mb-5 px-5 py-4 text-sm leading-relaxed"
          style={{
            background: '#13131f',
            border: '1px solid rgba(255,255,255,0.07)',
            maxHeight: '340px',
            color: 'rgba(255,255,255,0.65)',
          }}
        >
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', marginBottom: '1rem' }}>
            Last updated: May 28, 2026
          </p>

          <Section title="1. Acceptance">
            By installing or using Slate, you agree to these Terms of Service. If you do not agree, please uninstall the app.
          </Section>

          <Section title="2. What Slate Is">
            Slate is a free Windows streaming application that lets you broadcast to Twitch and YouTube. It is provided at no cost, with no subscription and no watermark.
          </Section>

          <Section title="3. Data We Collect">
            Slate collects limited, anonymous data to improve the app:{'\n\n'}
            • <strong style={{ color: 'rgba(255,255,255,0.75)' }}>Crash reports</strong> — when a stream drops unexpectedly, Slate sends an anonymous error log (error type, stream duration, connection code). No personal information is included.{'\n\n'}
            • <strong style={{ color: 'rgba(255,255,255,0.75)' }}>Download counts</strong> — when you download the app from slatestreaming.com, your country and platform type are logged. No IP addresses are stored.{'\n\n'}
            We do not sell, share, or monetise any data collected.
          </Section>

          <Section title="4. Platform Compliance">
            You are solely responsible for complying with the Terms of Service of any platform you stream to, including Twitch and YouTube. Slate is not affiliated with or endorsed by those platforms.
          </Section>

          <Section title="5. No Warranty">
            Slate is provided "as is" without warranty of any kind. We make no guarantees regarding uptime, stream reliability, recording quality, or compatibility with your hardware or streaming platform.
          </Section>

          <Section title="6. Limitation of Liability">
            To the fullest extent permitted by law, Slate and its developers are not liable for any direct, indirect, incidental, or consequential damages — including lost recordings, stream interruptions, or account actions taken by streaming platforms.
          </Section>

          <Section title="7. Intellectual Property">
            The Slate name, logo, and branding are the property of Slate. You may not reproduce or use them without written permission.
          </Section>

          <Section title="8. Changes to These Terms">
            We may update these Terms at any time. Significant changes will be noted in the app. Continued use after changes are posted constitutes acceptance of the updated Terms.
          </Section>

          <Section title="9. Contact">
            Questions about these Terms? Email{' '}
            <span style={{ color: '#FF4D4D' }}>nickgates907@gmail.com</span>
            {' '}or visit{' '}
            <span style={{ color: '#FF4D4D' }}>slatestreaming.com/terms</span>.
          </Section>
        </div>

        {/* Checkbox */}
        <label className="flex items-start gap-3 w-full mb-5 cursor-pointer select-none">
          <div
            onClick={() => setChecked(c => !c)}
            className="flex-shrink-0 flex items-center justify-center rounded mt-0.5"
            style={{
              width: '18px', height: '18px',
              background: checked ? '#FF4D4D' : 'transparent',
              border: `1.5px solid ${checked ? '#FF4D4D' : 'rgba(255,255,255,0.2)'}`,
              transition: 'all 0.15s',
            }}
          >
            {checked && (
              <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </div>
          <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.825rem', lineHeight: '1.4' }}>
            I have read and agree to the{' '}
            <span style={{ color: '#FF4D4D' }}>Terms of Service</span>
          </span>
        </label>

        {/* Accept button */}
        <button
          onClick={onAccept}
          disabled={!checked}
          className="w-full rounded-xl font-semibold py-3 transition-all"
          style={{
            background: checked ? '#FF4D4D' : 'rgba(255,255,255,0.06)',
            color: checked ? 'white' : 'rgba(255,255,255,0.25)',
            fontSize: '0.9rem',
            cursor: checked ? 'pointer' : 'not-allowed',
          }}
        >
          Get Started
        </button>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '1.1rem' }}>
      <p style={{ color: 'rgba(255,255,255,0.85)', fontWeight: 600, marginBottom: '0.35rem', fontSize: '0.825rem' }}>
        {title}
      </p>
      <p style={{ whiteSpace: 'pre-wrap' }}>{children}</p>
    </div>
  )
}
