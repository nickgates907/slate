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
}

export default function Titlebar({ dark, onToggleDark, onOpenSettings, isRecording, onToggleRecord, recordingTime, streamStatus, onOpenStreaming, liveTime }: TitlebarProps) {
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

      <div className="flex-1" />

      {/* Dark mode toggle */}
      <Tooltip text="Switch between light and dark theme" position="bottom">
      <button
        onClick={onToggleDark}
        className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
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
      <button onClick={onOpenSettings} className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
        Settings
      </button>
      </Tooltip>

      {/* Go Live button */}
      <Tooltip text="Stream to Twitch or YouTube — sign in with your account to get started" position="bottom">
      <button
        onClick={onOpenStreaming}
        disabled={isRecording}
        className={`flex items-center gap-2 text-sm font-semibold px-4 py-1.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
          streamStatus === 'live'
            ? 'bg-purple-600 text-white hover:bg-purple-500'
            : streamStatus === 'connecting'
            ? 'bg-purple-400 text-white cursor-wait'
            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
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

      {/* Record button */}
      <Tooltip text="Start recording. Click again to stop and save your video" position="bottom">
      <button
        onClick={onToggleRecord}
        disabled={streamStatus !== 'idle'}
        className={`flex items-center gap-2 text-sm font-semibold px-4 py-1.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
          isRecording
            ? 'bg-gray-800 text-white hover:bg-gray-700'
            : 'bg-brand-red text-white hover:bg-red-500'
        }`}
      >
        <div className={`flex-shrink-0 self-center ${isRecording ? 'w-3 h-3 bg-white rounded-sm' : 'w-2 h-2 bg-white rounded-full'}`} />
        {isRecording ? recordingTime : 'Record'}
      </button>
      </Tooltip>

    </div>
  )
}
