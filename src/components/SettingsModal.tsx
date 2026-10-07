import { useState } from 'react'
import { open } from '@tauri-apps/api/dialog'
import { RecordingSettings } from '../store'
import { SKINS } from '../lib/skins'
import Tooltip from './Tooltip'

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
    <div className="modal-backdrop">
      <div className="modal-shell w-[420px] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center px-5 py-4 border-b border-black/[0.08] dark:border-white/[0.08]">
          <span className="text-gray-900 dark:text-white font-semibold text-sm flex-1">Settings</span>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors text-lg leading-none">×</button>
        </div>

        <div className="p-5 flex flex-col gap-3 max-h-[70vh] overflow-y-auto">

          {/* Resolution + Frame Rate */}
          <div className="card-panel p-3.5 flex flex-col gap-4">
            <div>
              <label className="section-label mb-2 block">Resolution</label>
              <div className="pill-group w-full">
                {(['720p', '1080p', '1440p'] as const).map(r => (
                  <button
                    key={r}
                    onClick={() => setS(prev => ({ ...prev, resolution: r }))}
                    className={`pill flex-1 justify-center py-2 ${s.resolution === r ? 'pill-active' : ''}`}
                  >
                    {r}
                  </button>
                ))}
              </div>
              <p className="text-gray-400 dark:text-gray-600 text-xs mt-1.5">{resLabel[s.resolution]}</p>
            </div>

            <div>
              <label className="section-label mb-2 block">Frame Rate</label>
              <div className="pill-group w-full">
                {([30, 60] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setS(prev => ({ ...prev, fps: f }))}
                    className={`pill flex-1 justify-center py-2 ${s.fps === f ? 'pill-active' : ''}`}
                  >
                    {f} fps
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Bitrate */}
          <div className="card-panel p-3.5">
            <label className="section-label mb-2 block">Video Quality</label>
            <div className="pill-group w-full">
              {([
                { value: 4,  label: 'Good',   sub: '4 Mbps' },
                { value: 6,  label: 'Twitch',  sub: '6 Mbps' },
                { value: 8,  label: 'Great',   sub: '8 Mbps' },
                { value: 16, label: 'Ultra',   sub: '16 Mbps' },
              ] as const).map(({ value, label, sub }) => (
                <button
                  key={value}
                  onClick={() => setS(prev => ({ ...prev, bitrate: value }))}
                  className={`pill flex-1 py-2 flex flex-col items-center gap-0.5 ${s.bitrate === value ? 'pill-active' : ''}`}
                >
                  <span>{label}</span>
                  <span className={`text-xs font-normal ${s.bitrate === value ? 'text-white/70 dark:text-gray-900/60' : 'text-gray-400 dark:text-gray-600'}`}>{sub}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-600 mt-1.5">Twitch max 6 Mbps · YouTube up to 9 Mbps</p>
          </div>

          {/* Skins */}
          <div className="card-panel p-3.5">
            <label className="section-label mb-2 block">Skin</label>
            <div className="flex gap-1">
              {Object.values(SKINS).map(skin => {
                const owned = !skin.premium || (s.ownedSkins ?? []).includes(skin.id)
                const active = s.skin === skin.id
                return (
                  <Tooltip key={skin.id} text={owned ? skin.name : `${skin.name} — ${skin.price} (coming soon)`} position="top" className="flex-1">
                    <button
                      onClick={() => { if (owned) setS(prev => ({ ...prev, skin: skin.id })) }}
                      disabled={!owned}
                      className={`w-full flex flex-col items-center gap-1.5 py-2 rounded-lg transition-colors ${active ? 'bg-surface-card dark:bg-surface-dark-card' : 'hover:bg-surface-card dark:hover:bg-surface-dark-card'} ${!owned ? 'cursor-default' : ''}`}
                    >
                      <span
                        className="relative w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: `rgb(${skin.accent})`, opacity: owned ? 1 : 0.45 }}
                      >
                        {active && (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={`rgb(${skin.fg})`} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        )}
                        {!owned && (
                          <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-surface-card dark:bg-surface-dark-card border border-black/[0.08] dark:border-white/[0.08] flex items-center justify-center">
                            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-text-secondary dark:text-text-dark-secondary">
                              <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                            </svg>
                          </span>
                        )}
                      </span>
                      <span className="text-[10px] font-medium text-gray-700 dark:text-gray-300 truncate w-full text-center">{skin.name.replace('Slate ', '')}</span>
                      {skin.premium && (
                        <span className="text-[9px] text-text-secondary dark:text-text-dark-secondary">{owned ? 'Owned' : skin.price}</span>
                      )}
                    </button>
                  </Tooltip>
                )
              })}
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-600 mt-2">Cosmetic only — Slate's core features are always free. Paid skins aren't purchasable yet; this is a preview.</p>
          </div>

          {/* Save folder */}
          <div className="card-panel p-3.5">
            <label className="section-label mb-2 block">Save Recordings To</label>
            <div className="flex items-center gap-2">
              <span className="flex-1 text-xs text-gray-500 dark:text-gray-400 bg-surface-card dark:bg-surface-dark-card rounded-lg px-3 py-2 truncate">{folder || 'Documents/Slate Recordings'}</span>
              <button
                onClick={pickFolder}
                className="px-3 py-2 bg-surface-card hover:bg-surface-card-hover dark:bg-surface-dark-card dark:hover:bg-surface-dark-card-hover text-gray-800 dark:text-white text-xs font-semibold rounded-lg transition-colors flex-shrink-0"
              >
                Browse
              </button>
            </div>
          </div>

          {/* Show tooltips */}
          <div className="card-panel p-3.5 flex items-center justify-between">
            <div>
              <p className="section-label">Show Tips</p>
              <p className="text-xs text-gray-400 dark:text-gray-600 mt-0.5">Helpful hints on hover for new users</p>
            </div>
            <button
              onClick={() => setS(prev => ({ ...prev, showTooltips: !prev.showTooltips }))}
              className={`w-10 h-5 rounded-full transition-colors flex items-center px-0.5 flex-shrink-0 ${s.showTooltips ? 'bg-brand-red justify-end' : 'bg-gray-300 dark:bg-gray-700 justify-start'}`}
            >
              <div className="w-4 h-4 bg-white rounded-full shadow" />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 px-5 py-4 border-t border-black/[0.08] dark:border-white/[0.08]">
          <button
            onClick={() => { onRestoreScenes(); onClose() }}
            className="w-8 h-8 flex-shrink-0 flex items-center justify-center bg-surface-card hover:bg-surface-card-hover dark:bg-surface-dark-card dark:hover:bg-surface-dark-card-hover text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-lg transition-colors"
            title="Restore default scenes — adds Starting Soon, Sub Goal, New Sub, Raid, and End Screen scenes if you don't have them"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.95"/>
            </svg>
          </button>
          <div className="flex-1" />
          <button onClick={onClose} className="btn-secondary px-4 py-2 text-xs font-semibold">
            Cancel
          </button>
          <button
            onClick={() => { onSave(s, folder); onClose() }}
            className="btn-primary px-4 py-2 text-xs"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
