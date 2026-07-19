import { useState } from 'react'
import { open } from '@tauri-apps/api/dialog'
import { open as openUrl } from '@tauri-apps/api/shell'
import { RecordingSettings } from '../store'

const SUPPORT_URL = 'https://www.paypal.com/donate/?hosted_button_id=ANA7ESGZ5VYDW'

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-gray-900 rounded-2xl shadow-2xl w-[420px] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center px-5 py-4 border-b border-gray-800">
          <span className="text-white font-semibold text-sm flex-1">Settings</span>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors text-lg leading-none">×</button>
        </div>

        <div className="p-5 flex flex-col gap-5">

          {/* Resolution */}
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

          {/* FPS */}
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

          {/* Bitrate */}
          <div>
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
            <p className="text-xs text-gray-600 mt-1.5">Twitch max: 6 Mbps · YouTube: up to 9 Mbps. Higher than 6 Mbps may cause warnings on Twitch.</p>
          </div>

          {/* Save folder */}
          <div>
            <label className="text-xs text-gray-400 font-semibold tracking-widest uppercase mb-2 block">Save Recordings To</label>
            <div className="flex items-center gap-2">
              <span className="flex-1 text-xs text-gray-400 bg-gray-800 rounded-lg px-3 py-2 truncate">{folder || 'Documents/Slate Recordings'}</span>
              <button
                onClick={pickFolder}
                className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                Browse
              </button>
            </div>
          </div>

          {/* Show tooltips */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 font-semibold tracking-widest uppercase">Show Tips</p>
              <p className="text-xs text-gray-600 mt-0.5">Helpful hints on hover for new users</p>
            </div>
            <button
              onClick={() => setS(prev => ({ ...prev, showTooltips: !prev.showTooltips }))}
              className={`w-10 h-5 rounded-full transition-colors flex items-center px-0.5 ${s.showTooltips ? 'bg-brand-red justify-end' : 'bg-gray-700 justify-start'}`}
            >
              <div className="w-4 h-4 bg-white rounded-full shadow" />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 px-5 pb-5">
          <button
            onClick={() => { onRestoreScenes(); onClose() }}
            className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
            title="Adds Starting Soon, Sub Goal, New Sub, Raid, and End Screen scenes if you don't have them"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.95"/>
            </svg>
            Restore default scenes
          </button>
          <button
            onClick={() => openUrl(SUPPORT_URL)}
            className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
            title="Voluntary — helps fund further development of Slate. No features are ever locked behind this."
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            Support development
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
