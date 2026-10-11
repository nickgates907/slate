import { useState, useEffect } from 'react'
import Tooltip from './Tooltip'
import { SKINS, isSkinOwned, DEFAULT_SKIN_ID, applySkin } from '../lib/skins'
import SlateLogo from './SlateLogo'
import { sparklePath } from './ConstellationField'

type StreamStatus = 'idle' | 'connecting' | 'live'

interface TitlebarProps {
  dark: boolean
  onToggleDark: () => void
  onOpenSettings: () => void
  isRecording: boolean
  onToggleRecord: () => void
  recordingTime: string
  streamStatus: StreamStatus
  onOpenStreaming: () => void
  liveTime: string
  micEnabled: boolean
  onToggleMic: () => void
  audioLevel: number
  streamStats?: { fps: number; kbps: number }
  subCurrent: number
  subGoal: number
  onUpdateSubGoal: (current: number, goal: number) => void
  onClip?: () => void
  isClipping?: boolean
  activeSkin: string
  ownedSkins: string[]
  onChangeSkin: (skinId: string) => void
}

export default function Titlebar({ dark, onToggleDark, onOpenSettings, isRecording, onToggleRecord, recordingTime, streamStatus, onOpenStreaming, liveTime, micEnabled, onToggleMic, audioLevel, streamStats, subCurrent, subGoal, onUpdateSubGoal, onClip, isClipping, activeSkin, ownedSkins, onChangeSkin }: TitlebarProps) {
  const [showGoalEditor, setShowGoalEditor] = useState(false)
  const [showSkins, setShowSkins] = useState(false)
  const totalOwnedSkins = Object.values(SKINS).filter(s => isSkinOwned(s, ownedSkins)).length

  // Hovering a locked skin below previews it live via applySkin() without
  // touching the real selection. If the dropdown closes mid-hover (no
  // guaranteed mouseleave), fall back to re-applying the real active skin.
  useEffect(() => { if (!showSkins) applySkin(activeSkin) }, [showSkins, activeSkin])
  return (
    <div className="flex items-center gap-2 px-3 h-[46px] border-b border-black/[0.08] dark:border-panel-glow flex-shrink-0">

      {/* Logo */}
      <div className="flex items-center gap-2">
        <SlateLogo size={28} skinId={activeSkin} />
        <span className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">Slate</span>
      </div>

      {/* Stream health — shown while live */}
      {streamStatus === 'live' && streamStats && (streamStats.fps > 0 || streamStats.kbps > 0) && (
        <Tooltip text="Live stream health: frames per second and kilobits per second being sent" position="bottom">
          <div className="flex items-center gap-2 px-2.5 py-1 bg-surface-card dark:bg-surface-dark-card rounded-lg border border-black/[0.08] dark:border-panel-glow">
            <div className="flex items-center gap-1.5">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-green-500">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 tabular-nums">{streamStats.fps} fps</span>
            </div>
            <div className="flex items-center gap-1.5">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
              </svg>
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 tabular-nums">{streamStats.kbps} kbps</span>
            </div>
          </div>
        </Tooltip>
      )}

      {/* Sub goal quick editor — shown while live */}
      {streamStatus === 'live' && (
        <div className="relative">
          <Tooltip text="Update your sub goal counter live. It updates the scrolling banner on stream instantly." position="bottom">
            <button
              onClick={() => setShowGoalEditor(g => !g)}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-surface-card dark:bg-surface-dark-card hover:bg-surface-card-hover dark:hover:bg-surface-dark-card-hover rounded-lg border border-black/[0.08] dark:border-panel-glow transition-colors"
            >
              <span className="text-sm">⭐</span>
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 tabular-nums">{subCurrent} / {subGoal}</span>
            </button>
          </Tooltip>
          {showGoalEditor && (
            <div className="absolute top-full left-0 mt-1.5 modal-shell p-3 z-50 flex flex-col gap-2 w-44">
              <p className="section-label">Sub Goal</p>
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-500 w-14 shrink-0">Current</label>
                <div className="flex items-center gap-1">
                  <button onClick={() => onUpdateSubGoal(Math.max(0, subCurrent - 1), subGoal)} className="w-6 h-6 rounded bg-surface-card hover:bg-surface-card-hover dark:bg-surface-dark-card dark:hover:bg-surface-dark-card-hover text-gray-800 dark:text-white text-xs font-bold flex items-center justify-center">−</button>
                  <input
                    type="number" min={0} value={subCurrent}
                    onChange={e => onUpdateSubGoal(Math.max(0, parseInt(e.target.value) || 0), subGoal)}
                    className="w-10 text-center text-xs font-bold text-gray-800 dark:text-white bg-surface-card dark:bg-surface-dark-card border border-black/[0.08] dark:border-panel-glow rounded px-1 py-0.5"
                  />
                  <button onClick={() => onUpdateSubGoal(subCurrent + 1, subGoal)} className="w-6 h-6 rounded bg-surface-card hover:bg-surface-card-hover dark:bg-surface-dark-card dark:hover:bg-surface-dark-card-hover text-gray-800 dark:text-white text-xs font-bold flex items-center justify-center">+</button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-500 w-14 shrink-0">Goal</label>
                <input
                  type="number" min={1} value={subGoal}
                  onChange={e => onUpdateSubGoal(subCurrent, Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-16 text-center text-xs font-bold text-gray-800 dark:text-white bg-surface-card dark:bg-surface-dark-card border border-black/[0.08] dark:border-panel-glow rounded px-1 py-0.5"
                />
              </div>
              <button onClick={() => setShowGoalEditor(false)} className="text-xs text-gray-500 hover:text-gray-900 dark:hover:text-white text-center mt-0.5 transition-colors">Done</button>
            </div>
          )}
        </div>
      )}

      <div className="flex-1 relative self-stretch">
        {activeSkin === 'midnight-skies' && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 46" preserveAspectRatio="xMidYMid meet" fill="none">
            {[
              { pts: [[20, 22, 3, '#FFEAA7'], [38, 16, 2, 'white'], [50, 28, 1.8, 'white']] },
              { pts: [[85, 16, 3, '#FFEAA7'], [103, 24, 2, 'white'], [70, 30, 1.8, '#A29BFE']] },
              { pts: [[150, 26, 3, '#FFEAA7'], [168, 18, 2, 'white'], [180, 32, 1.8, 'white']] },
              { pts: [[215, 18, 3, '#FFEAA7'], [233, 28, 2, 'white'], [200, 32, 1.8, '#A29BFE']] },
              { pts: [[280, 24, 3, '#FFEAA7'], [298, 14, 2, 'white'], [310, 30, 1.8, 'white']] },
              { pts: [[345, 18, 3, '#FFEAA7'], [363, 26, 2, 'white'], [330, 30, 1.8, '#A29BFE']] },
            ].map((cluster, ci) => (
              <g key={ci}>
                <path
                  d={cluster.pts.map((p, j) => `${j === 0 ? 'M' : 'L'}${p[0]} ${p[1]}`).join(' ')}
                  stroke="#A29BFE" strokeWidth="0.8" strokeOpacity="0.4" fill="none"
                />
                {cluster.pts.map((p, j) => (
                  <path
                    key={j}
                    d={sparklePath(Number(p[0]), Number(p[1]), Number(p[2]))}
                    fill={String(p[3])}
                    className="animate-twinkle"
                    style={{ transformBox: 'fill-box', transformOrigin: 'center', animationDelay: `${(ci * 3 + j) * 0.5}s` }}
                  />
                ))}
              </g>
            ))}
          </svg>
        )}
      </div>

      {/* Skins collected */}
      <div className="relative">
        <Tooltip text="See every skin — owned and locked" position="bottom">
          <button
            onClick={() => setShowSkins(v => !v)}
            className="accent-gradient-border-hover btn-secondary flex items-center gap-1.5 text-[11px] px-2.5 h-[30px]"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="13.5" cy="6.5" r="2.5"/><circle cx="19" cy="13" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="10" cy="19" r="2.5"/>
            </svg>
            Skins
            <span className="text-text-secondary dark:text-text-dark-secondary tabular-nums">{totalOwnedSkins}/{Object.keys(SKINS).length}</span>
          </button>
        </Tooltip>
        {showSkins && (
          <div className="absolute top-full right-0 mt-1.5 modal-shell p-3 z-50 flex flex-col gap-2 w-56">
            <p className="section-label">Skins Collected</p>
            <div className="grid grid-cols-4 gap-1.5">
              {Object.values(SKINS).map(skin => {
                const owned = isSkinOwned(skin, ownedSkins)
                const active = activeSkin === skin.id
                return (
                  <Tooltip key={skin.id} text={!owned ? `${skin.name} — hover to preview, locked` : skin.id === DEFAULT_SKIN_ID ? `${skin.name} (Default)` : skin.name} position="top">
                    <button
                      onClick={() => { if (owned) onChangeSkin(skin.id) }}
                      onMouseEnter={() => { if (!owned) applySkin(skin.id) }}
                      onMouseLeave={() => { if (!owned) applySkin(activeSkin) }}
                      className={`w-full flex flex-col items-center gap-1 py-1.5 rounded-lg transition-colors ${active ? 'bg-surface-card dark:bg-surface-dark-card' : 'hover:bg-surface-card dark:hover:bg-surface-dark-card'} ${!owned ? 'cursor-pointer' : ''}`}
                    >
                      <span
                        className="relative w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: skin.gradient ?? `rgb(${skin.accent})`, opacity: owned ? 1 : 0.4 }}
                      >
                        {active && (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={`rgb(${skin.fg})`} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        )}
                        {!owned && (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="absolute -bottom-1 -right-1 text-text-secondary dark:text-text-dark-secondary bg-surface-card dark:bg-surface-dark-card rounded-full border border-black/[0.08] dark:border-panel-glow p-0.5">
                            <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                          </svg>
                        )}
                      </span>
                      <span className="text-[9px] font-medium text-gray-700 dark:text-gray-300 truncate w-full text-center">{skin.name.replace('Slate ', '')}</span>
                    </button>
                  </Tooltip>
                )
              })}
            </div>
            <button onClick={() => { setShowSkins(false); onOpenSettings() }} className="text-[11px] text-brand-red hover:underline text-center mt-0.5">
              Manage &amp; unlock more →
            </button>
          </div>
        )}
      </div>

      {/* Dark mode toggle */}
      <Tooltip text="Switch between light and dark theme" position="bottom">
      <button
        onClick={onToggleDark}
        className="accent-gradient-border-hover btn-secondary flex items-center gap-1.5 text-[11px] px-2.5 h-[30px]"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
        Dark mode
        <div className={`w-8 h-4 rounded-full transition-colors flex items-center px-0.5 ${dark ? 'bg-brand-red justify-end' : 'bg-gray-300 justify-start'}`}>
          <div className="w-3 h-3 bg-white rounded-full" />
        </div>
      </button>
      </Tooltip>

      {/* Settings */}
      <Tooltip text="Change video quality, frame rate, and where recordings are saved" position="bottom">
      <button onClick={onOpenSettings} className="accent-gradient-border-hover btn-secondary flex items-center gap-1.5 text-[11px] px-2.5 h-[30px]">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
        Settings
      </button>
      </Tooltip>

      {/* Clip button — save last 30s, only shown while live */}
      {streamStatus === 'live' && (
        <Tooltip text="Save the last 30 seconds as a clip, saved to your recordings folder" position="bottom">
          <button
            onClick={onClip}
            disabled={isClipping}
            className="accent-gradient-border-hover btn-secondary flex items-center gap-1.5 text-[11px] font-semibold px-2.5 h-[30px] disabled:opacity-50 disabled:cursor-wait"
          >
            {isClipping ? (
              <span className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                <line x1="8" y1="12" x2="8" y2="12" strokeWidth="3"/>
              </svg>
            )}
            Clip
          </button>
        </Tooltip>
      )}

      {/* Go Live button */}
      <Tooltip text={`Stream to Twitch or YouTube  ·  ${streamStatus === 'live' ? 'Ctrl+Shift+E to end' : 'Ctrl+Shift+L to go live'}`} position="bottom">
      <button
        onClick={onOpenStreaming}
        disabled={isRecording}
        className={`flex items-center gap-1.5 text-[11px] font-semibold px-3 h-[30px] transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
          streamStatus === 'live'
            ? 'bg-purple-600 text-white hover:bg-purple-500 rounded-lg'
            : streamStatus === 'connecting'
            ? 'bg-purple-400 text-white cursor-wait rounded-lg'
            : 'accent-gradient-border border-2 border-transparent text-brand-red hover:bg-brand-red/10 hover:text-gray-900 dark:hover:text-white rounded-md'
        }`}
      >
        {streamStatus === 'live' ? (
          <>
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            LIVE {liveTime}
          </>
        ) : streamStatus === 'connecting' ? (
          <>
            <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Connecting...
          </>
        ) : (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
            </svg>
            Go Live
          </>
        )}
      </button>
      </Tooltip>

      {/* Mic toggle — always visible so you never go live silent */}
      <Tooltip text={micEnabled ? 'Microphone is ON, click to mute' : 'Microphone is OFF, click to unmute'} position="bottom">
        <button
          onClick={onToggleMic}
          className={`relative flex items-center gap-1.5 text-[11px] font-semibold px-2.5 h-[30px] rounded-lg border transition-colors ${
            micEnabled
              ? 'bg-green-500/10 border-green-500/30 text-green-600 hover:bg-green-500/20 dark:bg-green-500/15 dark:border-green-500/40 dark:text-green-400 dark:hover:bg-green-500/25'
              : 'bg-red-500/10 border-red-500/30 text-red-600 hover:bg-red-500/20 dark:bg-red-500/15 dark:border-red-500/40 dark:text-red-400 dark:hover:bg-red-500/25'
          }`}
        >
          {micEnabled ? (
            /* mic on */
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              <line x1="12" y1="19" x2="12" y2="23"/>
              <line x1="8" y1="23" x2="16" y2="23"/>
            </svg>
          ) : (
            /* mic off / slashed */
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="1" y1="1" x2="23" y2="23"/>
              <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/>
              <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"/>
              <line x1="12" y1="19" x2="12" y2="23"/>
              <line x1="8" y1="23" x2="16" y2="23"/>
            </svg>
          )}
          Mic
          {/* live level bar — tiny green bars when mic is on and picking up audio */}
          {micEnabled && (
            <span className="flex items-end gap-px h-3">
              <span className="w-0.5 rounded-sm bg-green-600 dark:bg-green-400 transition-all duration-75" style={{ height: `${Math.max(20, audioLevel * 100)}%` }} />
              <span className="w-0.5 rounded-sm bg-green-600 dark:bg-green-400 transition-all duration-75" style={{ height: `${Math.max(35, audioLevel * 140)}%` }} />
              <span className="w-0.5 rounded-sm bg-green-600 dark:bg-green-400 transition-all duration-75" style={{ height: `${Math.max(55, audioLevel * 120)}%` }} />
            </span>
          )}
        </button>
      </Tooltip>

      {/* Record button */}
      <Tooltip text={`${isRecording ? 'Stop recording' : 'Start recording'}  ·  Ctrl+Shift+R`} position="bottom">
      <button
        onClick={onToggleRecord}
        disabled={streamStatus !== 'idle'}
        className={`flex items-center gap-1.5 text-[11px] px-3 h-[30px] rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
          isRecording
            ? 'accent-gradient-bg bg-brand-red text-brand-on-accent hover:bg-brand-red-hover font-semibold'
            : 'accent-gradient-border border-2 border-transparent text-brand-red hover:bg-brand-red/10 hover:text-gray-900 dark:hover:text-white'
        }`}
      >
        <div className={`flex-shrink-0 self-center ${isRecording ? 'w-3 h-3 bg-white rounded-sm' : 'w-2 h-2 bg-brand-red rounded-full'}`} />
        {isRecording ? recordingTime : 'Record'}
      </button>
      </Tooltip>

    </div>
  )
}
