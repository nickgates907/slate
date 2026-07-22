import { useState } from 'react'
import type { CSSProperties } from 'react'
import { invoke } from '@tauri-apps/api/tauri'
import { TWITCH_CLIENT_ID, YOUTUBE_CLIENT_ID, generatePkce } from '../config/platforms'

type Platform = 'twitch' | 'youtube'
type StreamStatus = 'idle' | 'connecting' | 'live'

interface ConnectedAccount {
  username: string
  streamKey: string
  platform: Platform
  token: string
  broadcasterId: string
}

interface PlatformState {
  status: 'idle' | 'waiting' | 'connected' | 'error'
  account: ConnectedAccount | null
  error: string
}

interface StreamingModalProps {
  onGoLive: (rtmpUrls: string[], twitchToken?: string) => void
  onEndStream: () => void
  status: StreamStatus
  liveTime: string
  onClose: () => void
}

function getRtmpUrl(account: ConnectedAccount): string {
  return account.platform === 'twitch'
    ? `rtmp://live.twitch.tv/app/${account.streamKey}`
    : `rtmp://a.rtmp.youtube.com/live2/${account.streamKey}`
}

const IDLE: PlatformState = { status: 'idle', account: null, error: '' }
const NO_CREDENTIALS = !TWITCH_CLIENT_ID && !YOUTUBE_CLIENT_ID

const SlateLogo = () => (
  <svg width="26" height="26" viewBox="0 0 72 72" fill="none">
    <rect width="72" height="72" rx="18" fill="#FF4D4D"/>
    <circle cx="36" cy="36" r="17" stroke="white" strokeWidth="3" fill="none"/>
    <circle cx="36" cy="36" r="10" stroke="white" strokeWidth="2.5" fill="none"/>
    <circle cx="36" cy="36" r="4" fill="white"/>
    <circle cx="52" cy="20" r="5" fill="white"/>
    <circle cx="52" cy="20" r="2.5" fill="#FF4D4D"/>
  </svg>
)

export default function StreamingModal({ onGoLive, onEndStream, status, liveTime, onClose }: StreamingModalProps) {
  const [twitch, setTwitch] = useState<PlatformState>(IDLE)
  const [youtube, setYoutube] = useState<PlatformState>(IDLE)
  const [streamTitle, setStreamTitle] = useState('')
  const [gameInput, setGameInput] = useState('')
  const [metaSaving, setMetaSaving] = useState(false)
  const [metaWarning, setMetaWarning] = useState<string | null>(null)

  const isLive = status === 'live'
  const isConnecting = status === 'connecting'
  const isBusy = isLive || isConnecting
  const canGoLive = twitch.status === 'connected' || youtube.status === 'connected'

  // Allow closing whenever NOT in the middle of connecting or waiting for OAuth
  const canClose = !isConnecting && twitch.status !== 'waiting' && youtube.status !== 'waiting'

  const connect = async (platform: Platform) => {
    const set = platform === 'twitch' ? setTwitch : setYoutube
    set({ status: 'waiting', account: null, error: '' })
    try {
      let result: ConnectedAccount
      if (platform === 'twitch') {
        result = await invoke<ConnectedAccount>('connect_twitch', { clientId: TWITCH_CLIENT_ID })
      } else {
        const { codeVerifier, codeChallenge } = await generatePkce()
        result = await invoke<ConnectedAccount>('connect_youtube', { clientId: YOUTUBE_CLIENT_ID, codeVerifier, codeChallenge })
      }
      set({ status: 'connected', account: result, error: '' })
    } catch (e: unknown) {
      set({ status: 'error', account: null, error: e instanceof Error ? e.message : String(e) })
    }
  }

  const disconnect = (platform: Platform) => {
    const set = platform === 'twitch' ? setTwitch : setYoutube
    set(IDLE)
  }

  const handleGoLive = async () => {
    setMetaSaving(true)
    setMetaWarning(null)
    try {
      // ── Twitch: set title + game via Helix API ──────────────────────────────
      if (twitch.account && TWITCH_CLIENT_ID && (streamTitle.trim() || gameInput.trim())) {
        try {
          let gameId: string | undefined
          if (gameInput.trim()) {
            const gResp = await fetch(
              `https://api.twitch.tv/helix/games?name=${encodeURIComponent(gameInput.trim())}`,
              { headers: { Authorization: `Bearer ${twitch.account.token}`, 'Client-Id': TWITCH_CLIENT_ID } }
            )
            const gData = await gResp.json()
            gameId = gData.data?.[0]?.id
            if (!gameId) setMetaWarning(`Game "${gameInput.trim()}" not found on Twitch — title was saved but category wasn't set.`)
          }
          const body: Record<string, string> = {}
          if (streamTitle.trim()) body.title = streamTitle.trim()
          if (gameId) body.game_id = gameId
          if (Object.keys(body).length > 0) {
            const patchResp = await fetch(
              `https://api.twitch.tv/helix/channels?broadcaster_id=${twitch.account.broadcasterId}`,
              {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${twitch.account.token}`, 'Client-Id': TWITCH_CLIENT_ID, 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
              }
            )
            if (!patchResp.ok) {
              const errData = await patchResp.json().catch(() => ({}))
              setMetaWarning(`Twitch title/game not updated (${patchResp.status}). Try reconnecting your account.${errData?.message ? ' ' + errData.message : ''}`)
            }
          }
        } catch (e) {
          setMetaWarning('Could not reach Twitch to update title/game. Going live anyway.')
          console.warn('Twitch metadata update failed:', e)
        }
      }

      // ── YouTube: update the next upcoming live broadcast title ──────────────
      if (youtube.account && streamTitle.trim()) {
        try {
          const bResp = await fetch(
            'https://www.googleapis.com/youtube/v3/liveBroadcasts?part=snippet&mine=true&broadcastStatus=upcoming&maxResults=1',
            { headers: { Authorization: `Bearer ${youtube.account.token}` } }
          )
          const bData = await bResp.json()
          const broadcast = bData.items?.[0]
          if (broadcast?.id) {
            const snippet = { ...broadcast.snippet, title: streamTitle.trim() }
            await fetch('https://www.googleapis.com/youtube/v3/liveBroadcasts?part=snippet', {
              method: 'PUT',
              headers: { Authorization: `Bearer ${youtube.account.token}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: broadcast.id, snippet }),
            })
          }
        } catch (e) { console.warn('YouTube metadata update failed (non-fatal):', e) }
      }
    } finally {
      setMetaSaving(false)
    }

    const accounts = [twitch.account, youtube.account].filter((a): a is ConnectedAccount => a !== null)
    onGoLive(accounts.map(getRtmpUrl), twitch.account?.token)
  }

  const connectedPlatforms = [twitch.account, youtube.account]
    .filter((a): a is ConnectedAccount => a !== null)
    .map(a => a.platform === 'twitch' ? 'Twitch' : 'YouTube')
    .join(' + ')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop — always closes when canClose */}
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        onClick={canClose ? onClose : undefined}
      />

      <div
        className="relative w-full max-w-[380px] mx-4 rounded-2xl overflow-hidden shadow-2xl border border-white/5"
        style={{ background: 'linear-gradient(180deg, #111118 0%, #0d0d13 100%)' }}
      >
        {/* Brand accent bar */}
        <div className="h-px w-full" style={{ background: 'linear-gradient(90deg, transparent, #FF4D4D 40%, #FF4D4D 60%, transparent)' }} />

        {/* Header */}
        <div className="px-5 pt-4 pb-3.5 flex items-center justify-between border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <SlateLogo />
            {isLive ? (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 bg-brand-red text-white text-[11px] font-bold px-2.5 py-1 rounded-full tracking-wide">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  LIVE {liveTime}
                </span>
                {connectedPlatforms && (
                  <span className="text-[11px] text-gray-500">{connectedPlatforms}</span>
                )}
              </div>
            ) : (
              <div>
                <p className="text-sm font-bold text-white leading-tight">Go Live</p>
                <p className="text-[10px] text-gray-600 uppercase tracking-widest">Slate Stream Manager</p>
              </div>
            )}
          </div>

          {/* X is always visible when canClose — including while live */}
          {canClose && (
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-600 hover:text-gray-300 hover:bg-white/5 transition-all"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          )}
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-2">

          {NO_CREDENTIALS && (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-[11px] text-amber-400">
              Streaming is not configured yet. Contact support.
            </div>
          )}

          {/* Live state — show hint, not the platform rows */}
          {isLive && (
            <div className="py-4 flex flex-col items-center gap-3">
              <div className="inline-flex items-center gap-2 text-xs text-gray-400 bg-white/5 rounded-full px-4 py-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                You're streaming live
              </div>
              <p className="text-[11px] text-gray-600 text-center">
                Close this window to keep streaming and adjust your scene.
              </p>
            </div>
          )}

          {/* Connecting spinner */}
          {isConnecting && (
            <div className="py-6 flex flex-col items-center gap-3">
              <div className="relative w-14 h-14 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-2 border-white/5" />
                <div className="w-10 h-10 rounded-full border-2 border-brand-red border-t-transparent animate-spin" />
                <div className="absolute"><SlateLogo /></div>
              </div>
              <div className="text-center">
                <p className="text-sm text-white font-semibold">Starting stream…</p>
                <p className="text-[11px] text-gray-500 mt-0.5">{connectedPlatforms}</p>
              </div>
            </div>
          )}

          {/* Platform rows — only shown when not connecting or live */}
          {!isBusy && (
            <>
              {TWITCH_CLIENT_ID && (
                <PlatformRow
                  platform="twitch"
                  state={twitch}
                  onConnect={() => connect('twitch')}
                  onDisconnect={() => disconnect('twitch')}
                  disabled={youtube.status === 'waiting'}
                />
              )}
              {YOUTUBE_CLIENT_ID && (
                <PlatformRow
                  platform="youtube"
                  state={youtube}
                  onConnect={() => connect('youtube')}
                  onDisconnect={() => disconnect('youtube')}
                  disabled={twitch.status === 'waiting'}
                />
              )}

              {/* Stream metadata — shown when at least one platform is connected */}
              {canGoLive && (
                <div className="pt-1 space-y-2">
                  <div className="h-px w-full bg-white/[0.05]" />
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Stream title  (optional)"
                      value={streamTitle}
                      onChange={e => setStreamTitle(e.target.value)}
                      className="w-full text-sm bg-white/[0.04] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-white placeholder-gray-600 outline-none focus:border-brand-red/50 transition-colors"
                    />
                    {twitch.status === 'connected' && (
                      <input
                        type="text"
                        placeholder="Game / category  (e.g. Marvel Rivals)"
                        value={gameInput}
                        onChange={e => setGameInput(e.target.value)}
                        className="w-full text-sm bg-white/[0.04] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-white placeholder-gray-600 outline-none focus:border-brand-red/50 transition-colors"
                      />
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 pt-1 space-y-2">
          {/* Metadata warning — shown briefly if title/game failed to update */}
          {metaWarning && !isLive && !isConnecting && (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-3.5 py-2.5 text-[11px] text-amber-400 leading-relaxed">
              ⚠ {metaWarning}
            </div>
          )}
          {isLive ? (
            <button
              onClick={onEndStream}
              className="w-full py-3 rounded-xl font-bold text-sm text-white bg-white/[0.08] hover:bg-white/[0.13] transition-colors"
            >
              End Stream
            </button>
          ) : isConnecting ? (
            <button
              onClick={onEndStream}
              className="w-full py-3 rounded-xl font-semibold text-sm text-gray-500 bg-white/[0.05]"
            >
              Cancel
            </button>
          ) : (
            <button
              onClick={handleGoLive}
              disabled={!canGoLive || metaSaving}
              className={`w-full py-3 rounded-xl font-bold text-sm text-white transition-all disabled:opacity-25 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${!canGoLive ? 'bg-white/[0.06]' : ''}`}
              style={canGoLive ? { background: 'linear-gradient(135deg, #FF4D4D 0%, #e03030 100%)', boxShadow: '0 4px 20px rgba(255,77,77,0.35)' } : undefined}
            >
              {metaSaving ? (
                <>
                  <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Setting up…
                </>
              ) : canGoLive ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  Go Live{connectedPlatforms ? ` · ${connectedPlatforms}` : ''}
                </>
              ) : (
                <span className="text-gray-500">Connect an account to go live</span>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Per-platform row ──────────────────────────────────────────────────────────

interface PlatformRowProps {
  platform: Platform
  state: PlatformState
  onConnect: () => void
  onDisconnect: () => void
  disabled?: boolean
}

const PLATFORM_META = {
  twitch: {
    label: 'Twitch',
    color: '#9147ff',
    dimColor: 'rgba(145,71,255,0.15)',
    borderColor: 'rgba(145,71,255,0.3)',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
        <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/>
      </svg>
    ),
  },
  youtube: {
    label: 'YouTube',
    color: '#ff0000',
    dimColor: 'rgba(255,0,0,0.12)',
    borderColor: 'rgba(255,0,0,0.25)',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
    ),
  },
}

function PlatformRow({ platform, state, onConnect, onDisconnect, disabled }: PlatformRowProps) {
  const meta = PLATFORM_META[platform]

  if (state.status === 'waiting') {
    return (
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl border" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)' }}>
        <div className="w-3 h-3 rounded-full border-2 animate-spin flex-shrink-0" style={{ borderColor: meta.color, borderTopColor: 'transparent' }} />
        <p className="text-sm text-gray-400 flex-1">Waiting for {meta.label} sign-in…</p>
        <button onClick={onDisconnect} className="text-[11px] text-gray-600 hover:text-red-400 transition-colors flex-shrink-0">Cancel</button>
      </div>
    )
  }

  if (state.status === 'connected' && state.account) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl border" style={{ background: meta.dimColor, borderColor: meta.borderColor }}>
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: meta.color }}>
          {state.account.username[0]?.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{state.account.username}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
            <span className="text-[11px] text-gray-500">{meta.label} · Ready to go live</span>
          </div>
        </div>
        <button onClick={onDisconnect} className="text-[11px] text-gray-600 hover:text-red-400 transition-colors flex-shrink-0">Remove</button>
      </div>
    )
  }

  if (state.status === 'error') {
    return (
      <div className="space-y-1.5">
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-2.5 text-[11px] text-red-400">
          {meta.label}: {state.error}
        </div>
        <button onClick={onConnect} className="w-full py-2 text-[11px] text-gray-500 hover:text-gray-300 rounded-xl transition-colors border border-white/5 hover:border-white/10">
          Retry {meta.label}
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={onConnect}
      disabled={disabled}
      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-white/[0.07] bg-white/[0.03] transition-all group disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[var(--hover-bg)] hover:border-[var(--hover-border)]"
      style={{ '--hover-bg': meta.dimColor, '--hover-border': meta.borderColor } as CSSProperties}
    >
      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: meta.color }}>
        <span className="text-white">{meta.icon}</span>
      </div>
      <div className="flex-1 text-left">
        <p className="text-sm font-semibold text-white">Sign in with {meta.label}</p>
        <p className="text-[11px] text-gray-600 mt-0.5">Connect your account to stream</p>
      </div>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-700 group-hover:text-gray-400 transition-colors flex-shrink-0">
        <path d="M9 18l6-6-6-6"/>
      </svg>
    </button>
  )
}
