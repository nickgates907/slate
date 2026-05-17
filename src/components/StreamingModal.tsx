import { useState } from 'react'
import { invoke } from '@tauri-apps/api/tauri'
import { TWITCH_CLIENT_ID, YOUTUBE_CLIENT_ID, generatePkce } from '../config/platforms'

type Platform = 'twitch' | 'youtube'
type StreamStatus = 'idle' | 'connecting' | 'live'

interface ConnectedAccount {
  username: string
  streamKey: string
  platform: Platform
}

interface PlatformState {
  status: 'idle' | 'waiting' | 'connected' | 'error'
  account: ConnectedAccount | null
  error: string
}

interface StreamingModalProps {
  onGoLive: (rtmpUrls: string[]) => void
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

export default function StreamingModal({ onGoLive, onEndStream, status, liveTime, onClose }: StreamingModalProps) {
  const [twitch, setTwitch] = useState<PlatformState>(IDLE)
  const [youtube, setYoutube] = useState<PlatformState>(IDLE)

  const isLive = status === 'live'
  const isConnecting = status === 'connecting'
  const isBusy = isLive || isConnecting

  const canGoLive = twitch.status === 'connected' || youtube.status === 'connected'

  const connect = async (platform: Platform) => {
    const set = platform === 'twitch' ? setTwitch : setYoutube
    set({ status: 'waiting', account: null, error: '' })

    try {
      let result: ConnectedAccount

      if (platform === 'twitch') {
        result = await invoke<ConnectedAccount>('connect_twitch', { clientId: TWITCH_CLIENT_ID })
      } else {
        const { codeVerifier, codeChallenge } = await generatePkce()
        result = await invoke<ConnectedAccount>('connect_youtube', {
          clientId: YOUTUBE_CLIENT_ID,
          codeVerifier,
          codeChallenge,
        })
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

  const handleGoLive = () => {
    const urls = [twitch.account, youtube.account]
      .filter((a): a is ConnectedAccount => a !== null)
      .map(getRtmpUrl)
    onGoLive(urls)
  }

  const connectedPlatforms = [twitch.account, youtube.account]
    .filter((a): a is ConnectedAccount => a !== null)
    .map(a => a.platform === 'twitch' ? 'Twitch' : 'YouTube')
    .join(' + ')

  const canClose = !isBusy && twitch.status !== 'waiting' && youtube.status !== 'waiting'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={canClose ? onClose : undefined}
      />

      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">

        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          {isLive ? (
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-2 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                LIVE {liveTime}
              </span>
              {connectedPlatforms && (
                <span className="text-xs text-gray-500 dark:text-gray-400">{connectedPlatforms}</span>
              )}
            </div>
          ) : (
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Go Live</h2>
          )}
          {canClose && (
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          )}
        </div>

        <div className="px-6 py-5 space-y-3">

          {NO_CREDENTIALS && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-4 py-3 text-xs text-amber-800 dark:text-amber-300">
              Streaming is not configured yet. Contact support.
            </div>
          )}

          {/* Twitch row */}
          {TWITCH_CLIENT_ID && !isBusy && (
            <PlatformRow
              platform="twitch"
              state={twitch}
              onConnect={() => connect('twitch')}
              onDisconnect={() => disconnect('twitch')}
              disabled={youtube.status === 'waiting'}
            />
          )}

          {/* YouTube row */}
          {YOUTUBE_CLIENT_ID && !isBusy && (
            <PlatformRow
              platform="youtube"
              state={youtube}
              onConnect={() => connect('youtube')}
              onDisconnect={() => disconnect('youtube')}
              disabled={twitch.status === 'waiting'}
            />
          )}

          {/* Live / connecting status */}
          {isBusy && (
            <div className="text-center py-4 space-y-2">
              {isConnecting ? (
                <>
                  <div className="w-10 h-10 border-4 border-brand-red border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Starting stream to {connectedPlatforms}…
                  </p>
                </>
              ) : (
                <p className="text-xs text-gray-400">You're live. Close this window to keep streaming.</p>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 pb-6">
          {isLive ? (
            <button
              onClick={onEndStream}
              className="w-full py-2.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-white font-semibold text-sm transition-colors"
            >
              End Stream
            </button>
          ) : isConnecting ? (
            <button onClick={onEndStream} className="w-full py-2.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 font-semibold text-sm">
              Cancel
            </button>
          ) : (
            <button
              onClick={handleGoLive}
              disabled={!canGoLive}
              className="w-full py-2.5 rounded-lg bg-brand-red hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
            >
              <span className="w-2 h-2 rounded-full bg-white" />
              {canGoLive ? `Go Live${connectedPlatforms ? ` · ${connectedPlatforms}` : ''}` : 'Connect an account to go live'}
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
    color: 'bg-purple-600 hover:bg-purple-500',
    badge: 'bg-purple-600',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/>
      </svg>
    ),
  },
  youtube: {
    label: 'YouTube',
    color: 'bg-red-600 hover:bg-red-500',
    badge: 'bg-red-600',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
    ),
  },
}

function PlatformRow({ platform, state, onConnect, onDisconnect, disabled }: PlatformRowProps) {
  const meta = PLATFORM_META[platform]

  if (state.status === 'waiting') {
    return (
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="w-3 h-3 border-2 border-brand-red border-t-transparent rounded-full animate-spin shrink-0" />
        <p className="text-sm text-gray-600 dark:text-gray-400 flex-1">
          Waiting for {meta.label} sign-in…
        </p>
        <button
          onClick={onDisconnect}
          className="text-xs text-gray-400 hover:text-red-400 transition-colors shrink-0"
        >
          Cancel
        </button>
      </div>
    )
  }

  if (state.status === 'connected' && state.account) {
    return (
      <div className="flex items-center gap-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl px-4 py-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${meta.badge}`}>
          {state.account.username[0]?.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{state.account.username}</p>
          <p className="text-xs text-green-600 dark:text-green-400">{meta.label} · ready</p>
        </div>
        <button onClick={onDisconnect} className="text-xs text-gray-400 hover:text-red-400 transition-colors shrink-0">
          Remove
        </button>
      </div>
    )
  }

  if (state.status === 'error') {
    return (
      <div className="space-y-2">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3 text-xs text-red-700 dark:text-red-300">
          {meta.label}: {state.error}
        </div>
        <button
          onClick={onConnect}
          className="w-full py-2 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-lg transition-colors"
        >
          Retry {meta.label}
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={onConnect}
      disabled={disabled}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white font-semibold text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${meta.color}`}
    >
      {meta.icon}
      Sign in with {meta.label}
    </button>
  )
}
