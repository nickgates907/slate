import { useState } from 'react'
import { open } from '@tauri-apps/api/dialog'
import { RecordingSettings } from '../store'

interface SettingsModalProps {
  settings: RecordingSettings
  saveFolder: string
  onSave: (settings: RecordingSettings, saveFolder: string) => void
  onRestoreScenes: () => void
  onClose: () => void
}

export default function SettingsModal({ settings, saveFolder, onSave, onRestoreScenes, onClose }: SettingsModalProps) {
  const [s, setS] = useState(settings)
  const [folder, setFolder] = useState(saveFolder)

  const pickFolder = async () => {
    const chosen = await open({ directory: true, title: 'Choose save folder' }).catch(() => null)
    if (chosen && !Array.isArray(chosen)) setFolder(chosen)
  }

  const resLabel: Record<RecordingSettings['resolution'], string> = {
    '720p': '720p — 1280×720',
    '1080p': '1080p — 1920×1080',
    '1440p': '1440p — 2560×1440',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-900 rounded-2xl shadow-2xl w-[420px] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center px-5 py-4 border-b border-gray-800">
          <span className="text-white font-semibold text-sm flex-1">Settings</span>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors text-lg leading-none">×</button>
        </div>

        <div className="p-5 flex flex-col gap-3 max-h-[70vh] overflow-y-auto">

          {/* Resolution + Frame Rate */}
          <div className="bg-gray-800/40 rounded-xl p-3.5 flex flex-col gap-4">
            <div>
              <label className="text-xs text-gray-400 font-semibold tracking-widest uppercase mb-2 block">Resolution</label>
              <div className="flex gap-2">
                {(['720p', '1080p', '1440p'] as const).map(r => (
                  <button
                    key={r}
                    onClick={() => setS(prev => ({ ...prev, resolution: r }))}
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors ${
                      s.resolution === r ? 'bg-brand-red text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
              <p className="text-gray-600 text-xs mt-1.5">{resLabel[s.resolution]}</p>
            </div>

            <div>
              <label className="text-xs text-gray-400 font-semibold tracking-widest uppercase mb-2 block">Frame Rate</label>
              <div className="flex gap-2">
                {([30, 60] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setS(prev => ({ ...prev, fps: f }))}
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors ${
                      s.fps === f ? 'bg-brand-red text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    {f} fps
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Bitrate */}
          <div className="bg-gray-800/40 rounded-xl p-3.5">
            <label className="text-xs text-gray-400 font-semibold tracking-widest uppercase mb-2 block">Video Quality</label>
            <div className="flex gap-2">
              {([
                { value: 4,  label: 'Good',   sub: '4 Mbps' },
                { value: 6,  label: 'Twitch',  sub: '6 Mbps' },
                { value: 8,  label: 'Great',   sub: '8 Mbps' },
                { value: 16, label: 'Ultra',   sub: '16 Mbps' },
              ] as const).map(({ value, label, sub }) => (
                <button
                  key={value}
                  onClick={() => setS(prev => ({ ...prev, bitrate: value }))}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors flex flex-col items-center gap-0.5 ${
                    s.bitrate === value ? 'bg-brand-red text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  <span>{label}</span>
                  <span className={`text-xs font-normal ${s.bitrate === value ? 'text-white/70' : 'text-gray-600'}`}>{sub}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-600 mt-1.5">Twitch max 6 Mbps · YouTube up to 9 Mbps</p>
          </div>

          {/* Save folder */}
          <div className="bg-gray-800/40 rounded-xl p-3.5">
            <label className="text-xs text-gray-400 font-semibold tracking-widest uppercase mb-2 block">Save Recordings To</label>
            <div className="flex items-center gap-2">
              <span className="flex-1 text-xs text-gray-400 bg-gray-900/60 rounded-lg px-3 py-2 truncate">{folder || 'Documents/Slate Recordings'}</span>
              <button
                onClick={pickFolder}
                className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white text-xs font-semibold rounded-lg transition-colors flex-shrink-0"
              >
                Browse
              </button>
            </div>
          </div>

          {/* Show tooltips */}
          <div className="bg-gray-800/40 rounded-xl p-3.5 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 font-semibold tracking-widest uppercase">Show Tips</p>
              <p className="text-xs text-gray-600 mt-0.5">Helpful hints on hover for new users</p>
            </div>
            <button
              onClick={() => setS(prev => ({ ...prev, showTooltips: !prev.showTooltips }))}
              className={`w-10 h-5 rounded-full transition-colors flex items-center px-0.5 flex-shrink-0 ${s.showTooltips ? 'bg-brand-red justify-end' : 'bg-gray-700 justify-start'}`}
            >
              <div className="w-4 h-4 bg-white rounded-full shadow" />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 px-5 py-4 border-t border-gray-800">
          <button
            onClick={() => { onRestoreScenes(); onClose() }}
            className="w-8 h-8 flex-shrink-0 flex items-center justify-center bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-lg transition-colors"
            title="Restore default scenes — adds Starting Soon, Sub Goal, New Sub, Raid, and End Screen scenes if you don't have them"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.95"/>
            </svg>
          </button>
          <div className="flex-1" />
          <button onClick={onClose} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-semibold rounded-lg transition-colors">
            Cancel
          </button>
          <button
            onClick={() => { onSave(s, folder); onClose() }}
            className="px-4 py-2 bg-brand-red hover:bg-red-500 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
