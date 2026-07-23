import { useState } from 'react'
import Tooltip from './Tooltip'

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
}

export default function Titlebar({ dark, onToggleDark, onOpenSettings, isRecording, onToggleRecord, recordingTime, streamStatus, onOpenStreaming, liveTime, micEnabled, onToggleMic, audioLevel, streamStats, subCurrent, subGoal, onUpdateSubGoal, onClip, isClipping }: TitlebarProps) {
  const [showGoalEditor, setShowGoalEditor] = useState(false)
  return (
    <div className="flex items-center gap-3 px-4 h-12 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">

      {/* Logo */}
      <div className="flex items-center gap-2">
        <svg width="28" height="28" viewBox="0 0 72 72" fill="none">
          <rect width="72" height="72" rx="18" fill="#FF4D4D"/>
          <circle cx="36" cy="36" r="17" stroke="white" strokeWidth="3" fill="none"/>
          <circle cx="36" cy="36" r="10" stroke="white" strokeWidth="2.5" fill="none"/>
          <circle cx="36" cy="36" r="4" fill="white"/>
          <circle cx="52" cy="20" r="5" fill="white"/>
          <circle cx="52" cy="20" r="2.5" fill="#FF4D4D"/>
        </svg>
        <span className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">Slate</span>
      </div>

      {/* Stream health — shown while live */}
      {streamStatus === 'live' && streamStats && (streamStats.fps > 0 || streamStats.kbps > 0) && (
        <Tooltip text="Live stream health: frames per second and kilobits per second being sent" position="bottom">
          <div className="flex items-center gap-3 px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
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
              className="flex items-center gap-1.5 px-3 py-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors"
            >
              <span className="text-sm">⭐</span>
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 tabular-nums">{subCurrent} / {subGoal}</span>
            </button>
          </Tooltip>
          {showGoalEditor && (
            <div className="absolute top-full left-0 mt-1.5 modal-shell p-3 z-50 flex flex-col gap-2 w-44">
              <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-widest">Sub Goal</p>
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-500 w-14 shrink-0">Current</label>
                <div className="flex items-center gap-1">
                  <button onClick={() => onUpdateSubGoal(Math.max(0, subCurrent - 1), subGoal)} className="w-6 h-6 rounded bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white text-xs font-bold flex items-center justify-center">−</button>
                  <input
                    type="number" min={0} value={subCurrent}
                    onChange={e => onUpdateSubGoal(Math.max(0, parseInt(e.target.value) || 0), subGoal)}
                    className="w-10 text-center text-xs font-bold text-gray-800 dark:text-white bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-1 py-0.5"
                  />
                  <button onClick={() => onUpdateSubGoal(subCurrent + 1, subGoal)} className="w-6 h-6 rounded bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white text-xs font-bold flex items-center justify-center">+</button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-500 w-14 shrink-0">Goal</label>
                <input
                  type="number" min={1} value={subGoal}
                  onChange={e => onUpdateSubGoal(subCurrent, Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-16 text-center text-xs font-bold text-gray-800 dark:text-white bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-1 py-0.5"
                />
              </div>
              <button onClick={() => setShowGoalEditor(false)} className="text-xs text-gray-500 hover:text-gray-900 dark:hover:text-white text-center mt-0.5 transition-colors">Done</button>
            </div>
          )}
        </div>
      )}

      <div className="flex-1" />

      {/* Dark mode toggle */}
      <Tooltip text="Switch between light and dark theme" position="bottom">
      <button
        onClick={onToggleDark}
        className="btn-secondary flex items-center gap-2 text-xs px-3 py-1.5"
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
      <button onClick={onOpenSettings} className="btn-secondary flex items-center gap-1.5 text-xs px-3 py-1.5">
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
            className="btn-secondary flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 disabled:opacity-50 disabled:cursor-wait"
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
        className={`flex items-center gap-2 text-sm font-semibold px-4 py-1.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
          streamStatus === 'live'
            ? 'bg-purple-600 text-white hover:bg-purple-500'
            : streamStatus === 'connecting'
            ? 'bg-purple-400 text-white cursor-wait'
            : 'btn-secondary'
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
          className={`relative flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
            micEnabled
              ? 'bg-green-500/15 border-green-500/40 text-green-400 hover:bg-green-500/25'
              : 'bg-red-500/15 border-red-500/40 text-red-400 hover:bg-red-500/25'
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
              <span className="w-0.5 rounded-sm bg-green-400 transition-all duration-75" style={{ height: `${Math.max(20, audioLevel * 100)}%` }} />
              <span className="w-0.5 rounded-sm bg-green-400 transition-all duration-75" style={{ height: `${Math.max(35, audioLevel * 140)}%` }} />
              <span className="w-0.5 rounded-sm bg-green-400 transition-all duration-75" style={{ height: `${Math.max(55, audioLevel * 120)}%` }} />
            </span>
          )}
        </button>
      </Tooltip>

      {/* Record button */}
      <Tooltip text={`${isRecording ? 'Stop recording' : 'Start recording'}  ·  Ctrl+Shift+R`} position="bottom">
      <button
        onClick={onToggleRecord}
        disabled={streamStatus !== 'idle'}
        className={`flex items-center gap-2 text-sm px-4 py-1.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
          isRecording
            ? 'bg-gray-800 text-white hover:bg-gray-700 font-semibold'
            : 'btn-primary'
        }`}
      >
        <div className={`flex-shrink-0 self-center ${isRecording ? 'w-3 h-3 bg-white rounded-sm' : 'w-2 h-2 bg-white rounded-full'}`} />
        {isRecording ? recordingTime : 'Record'}
      </button>
      </Tooltip>

    </div>
  )
}
