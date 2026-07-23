import { useEffect, useRef, useState } from 'react'
import { invoke } from '@tauri-apps/api/tauri'
import { RecordingResult, saveRecording } from '../hooks/useRecorder'

interface PlaybackModalProps {
  recording: RecordingResult
  saveFolder: string
  onClose: () => void
}

type SaveState = 'saving' | 'saved' | 'error'
type Mp4State = 'idle' | 'converting' | 'done' | 'error'

function formatDuration(secs: number) {
  const m = Math.floor(secs / 60).toString().padStart(2, '0')
  const s = (secs % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function PlaybackModal({ recording, saveFolder, onClose }: PlaybackModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [saveState, setSaveState] = useState<SaveState>('saving')
  const [savedPath, setSavedPath] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [mp4State, setMp4State] = useState<Mp4State>('idle')
  const [mp4Path, setMp4Path] = useState<string | null>(null)
  const [mp4Error, setMp4Error] = useState<string | null>(null)

  useEffect(() => {
    saveRecording(recording.blob, saveFolder || undefined)
      .then(path => { setSavedPath(path); setSaveState('saved') })
      .catch(e => { setSaveError(String(e)); setSaveState('error') })
  }, [recording.blob])

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.src = recording.blobUrl
      videoRef.current.play().catch(() => {})
    }
    return () => { URL.revokeObjectURL(recording.blobUrl) }
  }, [recording.blobUrl])

  const retrySave = () => {
    setSaveState('saving')
    setSaveError(null)
    saveRecording(recording.blob, saveFolder || undefined)
      .then(path => { setSavedPath(path); setSaveState('saved') })
      .catch(e => { setSaveError(String(e)); setSaveState('error') })
  }

  const exportMp4 = async () => {
    if (!savedPath) return
    setMp4State('converting')
    setMp4Error(null)
    try {
      const path = await invoke<string>('convert_to_mp4', { webmPath: savedPath })
      setMp4Path(path)
      setMp4State('done')
    } catch (e) {
      setMp4Error(String(e))
      setMp4State('error')
    }
  }

  return (
    <div className="modal-backdrop">
      <div className="modal-shell overflow-hidden flex flex-col"
        style={{ width: '72vw', maxWidth: 900 }}>

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-200 dark:border-gray-800">
          <div className="w-2 h-2 rounded-full bg-brand-red" />
          <span className="text-gray-900 dark:text-white font-semibold text-sm">Recording</span>
          <span className="text-gray-500 text-xs">
            {formatDuration(recording.durationSecs)} · {formatSize(recording.blob.size)}
          </span>
          <div className="flex-1" />
          <button onClick={onClose} className="text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors text-lg leading-none">×</button>
        </div>

        {/* Video */}
        <video
          ref={videoRef}
          controls
          className="w-full bg-black"
          style={{ maxHeight: '55vh' }}
        />

        <div className="p-5 flex flex-col gap-3">

          {/* Save status */}
          <div className="card-panel px-4 py-3 flex items-center gap-3">
            {saveState === 'saving' && (
              <>
                <div className="w-4 h-4 border-2 border-gray-300 dark:border-white/20 border-t-gray-600 dark:border-t-white rounded-full animate-spin flex-shrink-0" />
                <span className="text-gray-500 dark:text-gray-400 text-xs">Saving to Documents…</span>
              </>
            )}
            {saveState === 'saved' && (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                <span className="text-green-400 text-xs font-medium">Saved (.webm)</span>
                <span className="text-gray-500 text-xs truncate flex-1">{savedPath}</span>
              </>
            )}
            {saveState === 'error' && (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <span className="text-red-400 text-xs flex-1">{saveError}</span>
                <button onClick={retrySave} className="text-xs text-brand-red hover:text-red-400 font-semibold">Retry</button>
              </>
            )}
          </div>

          {/* MP4 export */}
          <div className="card-panel px-4 py-3 flex items-center gap-3">
            {mp4State === 'idle' && (
              <button
                onClick={exportMp4}
                disabled={saveState !== 'saved'}
                className="btn-primary flex items-center gap-1.5 px-3 py-1.5 disabled:opacity-40 text-xs"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                Export as MP4
              </button>
            )}
            {mp4State === 'converting' && (
              <>
                <div className="w-4 h-4 border-2 border-gray-300 dark:border-white/20 border-t-brand-red rounded-full animate-spin flex-shrink-0" />
                <span className="text-gray-500 dark:text-gray-400 text-xs">Converting to MP4…</span>
              </>
            )}
            {mp4State === 'done' && (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                <span className="text-green-400 text-xs font-medium">MP4 saved</span>
                <span className="text-gray-500 text-xs truncate flex-1">{mp4Path}</span>
              </>
            )}
            {mp4State === 'error' && (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <span className="text-red-400 text-xs flex-1">{mp4Error}</span>
                <button onClick={exportMp4} className="text-xs text-brand-red hover:text-red-400 font-semibold">Retry</button>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 flex items-center justify-end border-t border-gray-200 dark:border-gray-800 pt-4">
          <button
            onClick={onClose}
            className="btn-secondary px-4 py-1.5 text-xs font-semibold"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  )
}
