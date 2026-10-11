import { useState } from 'react'
import { open } from '@tauri-apps/api/dialog'
import { readBinaryFile } from '@tauri-apps/api/fs'
import { Source, saveMediaFile, deleteMediaFile } from '../store'
import { CameraDevice } from '../hooks/useCameraDevices'
import Tooltip from './Tooltip'

interface SourcesPanelProps {
  sources: Source[]
  onToggleVisible: (id: string) => void
  onAddSource: (type: Source['type']) => void
  onRemoveSource: (id: string) => void
  onReorderSource: (sourceId: string, direction: 'up' | 'down') => void
  onChangeCameraDevice: (sourceId: string, deviceId: string) => void
  onChangeVolume: (sourceId: string, volume: number) => void
  onUpdateSource: (sourceId: string, updates: Partial<Source>) => void
  cameraDevices: CameraDevice[]
  audioLevel: number
  skinId?: string
}

const typeIcon = (type: Source['type'], size = 15) => {
  switch (type) {
    case 'camera':
      return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/></svg>
    case 'screen':
      return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/></svg>
    case 'avatar':
      return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
    case 'audio':
      return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
    case 'image':
      return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
    case 'text':
      return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>
    case 'music':
      return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
    case 'browser':
      return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/><line x1="2" x2="22" y1="12" y2="12"/></svg>
  }
}

const EyeIcon = ({ visible }: { visible: boolean }) => (
  visible
    ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
    : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
)

function AudioMeter({ level }: { level: number }) {
  const bars = 8
  return (
    <div className="flex items-end gap-px h-3">
      {Array.from({ length: bars }, (_, i) => {
        const threshold = (i + 1) / bars
        const active = level >= threshold
        const isHot = threshold > 0.85
        return (
          <div
            key={i}
            className="w-1 rounded-sm transition-colors duration-75"
            style={{
              height: `${Math.round(((i + 1) / bars) * 100)}%`,
              backgroundColor: active ? (isHot ? '#ef4444' : '#22c55e') : '#374151',
            }}
          />
        )
      })}
    </div>
  )
}

const ADD_SOURCES = [
  { type: 'camera' as const,  short: 'Camera',  label: 'Add camera', tip: 'Add your webcam to the scene' },
  { type: 'screen' as const,  short: 'Screen',  label: 'Add screen', tip: 'Capture your entire screen or a game window' },
  { type: 'avatar' as const,  short: 'Avatar',  label: 'Add avatar', tip: 'Circular webcam, great for a face cam overlay' },
  { type: 'image'  as const,  short: 'Image',   label: 'Add image',  tip: 'Add a logo, overlay image, or graphic' },
  { type: 'audio'  as const,  short: 'Mic',     label: 'Add mic',    tip: 'Add your microphone so viewers can hear you' },
  { type: 'text'   as const,  short: 'Text',    label: 'Add text',   tip: 'Add text to your scene: name, social handles, alerts' },
  { type: 'music'  as const,  short: 'Music',   label: 'Add music',  tip: 'Play background or intro music that loops and plays through the stream' },
  { type: 'browser' as const, short: 'Browser', label: 'Add browser source', tip: 'Load a local HTML file for animated overlays, visualizers, custom scenes' },
]

const INPUT_SOURCE_TYPES: Source['type'][] = ['camera', 'screen', 'avatar', 'image', 'audio']
const OUTPUT_SOURCE_TYPES: Source['type'][] = ['music', 'browser']
const OVERLAY_SOURCE_TYPES: Source['type'][] = ['text']

export default function SourcesPanel({
  sources, onToggleVisible, onAddSource, onRemoveSource, onReorderSource,
  onChangeCameraDevice, onChangeVolume, onUpdateSource, cameraDevices, audioLevel, skinId,
}: SourcesPanelProps) {
  const [libraryOpen, setLibraryOpen] = useState(true)

  const renderDeviceGroup = (title: string, types: Source['type'][]) => (
    <div className="flex flex-col gap-1">
      <div className="px-0.5 text-[10px] font-bold tracking-wide uppercase text-text-secondary dark:text-text-dark-secondary">{title}</div>
      <div className="grid grid-cols-3 gap-1">
        {ADD_SOURCES.filter(s => types.includes(s.type)).map(({ type, short, tip }) => (
          <Tooltip key={type} text={tip} position="top" className="w-full">
            <button
              onClick={() => onAddSource(type)}
              className="accent-gradient-border-hover w-full group flex flex-col items-center justify-center gap-1 py-1.5 px-1 rounded-md bg-surface-card dark:bg-surface-dark-card border border-black/[0.08] dark:border-panel-glow transition-all duration-200 hover:bg-surface-card-hover dark:hover:bg-surface-dark-card-hover hover:border-brand-red active:border-brand-red hover:shadow-[0_0_12px_rgb(var(--accent-rgb)/0.3)] select-none"
            >
              <span className="flex items-center justify-center w-[26px] h-[26px] text-text-secondary dark:text-text-dark-secondary group-hover:text-brand-red transition-colors duration-200">
                {typeIcon(type, 24)}
              </span>
              <span
                className={`text-[9px] font-semibold tracking-tight leading-none truncate w-full text-center ${skinId === 'midnight-skies' ? '' : 'text-gray-900 dark:text-white'}`}
                style={skinId === 'midnight-skies' ? { color: '#FFEAA7' } : undefined}
              >{short}</span>
            </button>
          </Tooltip>
        ))}
      </div>
    </div>
  )

  return (
    <div className="flex flex-col gap-2.5 p-2.5 bg-surface-panel dark:bg-surface-dark-panel rounded-md border border-black/[0.08] dark:border-panel-glow h-full min-h-0">

      <div className="section-label flex-shrink-0">
        Sources
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto -mx-1 px-1 flex flex-col gap-2">
        {sources.map((source) => (
          <div key={source.id} className="accent-gradient-border-hover card-panel overflow-hidden flex-shrink-0 transition-all duration-200 hover:border-brand-red hover:shadow-[0_0_12px_rgb(var(--accent-rgb)/0.3)]">
            <div className="flex items-center gap-1.5 px-2 py-2.5 text-sm text-gray-700 dark:text-gray-300">

              {/* Reorder arrows */}
              <div className="flex flex-col gap-px flex-shrink-0">
                <Tooltip text="Move up. Sources higher in the list appear on top." position="left">
                  <button
                    onClick={() => onReorderSource(source.id, 'up')}
                    disabled={sources.indexOf(source) === 0}
                    className="text-gray-300 dark:text-gray-700 hover:text-gray-500 dark:hover:text-gray-400 disabled:opacity-20 transition-colors"
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
                  </button>
                </Tooltip>
                <Tooltip text="Move down. Sources lower in the list appear behind." position="left">
                  <button
                    onClick={() => onReorderSource(source.id, 'down')}
                    disabled={sources.indexOf(source) === sources.length - 1}
                    className="text-gray-300 dark:text-gray-700 hover:text-gray-500 dark:hover:text-gray-400 disabled:opacity-20 transition-colors"
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                  </button>
                </Tooltip>
              </div>

              <span className="text-gray-400 dark:text-gray-600">{typeIcon(source.type)}</span>
              <span className="flex-1 truncate text-xs">{source.name}</span>

              {source.type === 'audio' && source.visible && (
                <AudioMeter level={audioLevel} />
              )}

              <Tooltip text={source.visible ? 'Hide this source' : 'Show this source'} position="left">
                <button
                  onClick={() => onToggleVisible(source.id)}
                  className={`transition-colors ${source.visible ? 'text-gray-300 dark:text-gray-600 hover:text-gray-500' : 'text-gray-200 dark:text-gray-700 hover:text-gray-400'}`}
                >
                  <EyeIcon visible={source.visible} />
                </button>
              </Tooltip>

              <Tooltip text="Remove this source from the scene" position="left">
                <button
                  onClick={() => onRemoveSource(source.id)}
                  className="text-gray-200 dark:text-gray-700 hover:text-red-400 dark:hover:text-red-500 transition-colors"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </Tooltip>
            </div>

            {/* Volume slider */}
            {source.type === 'audio' && source.visible && (
              <div className="px-3 pb-2.5 flex items-center gap-2">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 flex-shrink-0">
                  <path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
                </svg>
                <Tooltip text="Adjust mic volume in your recording and stream" position="top" className="flex-1">
                  <input
                    type="range"
                    min={0} max={1} step={0.01}
                    value={source.volume ?? 1}
                    onChange={e => onChangeVolume(source.id, Number(e.target.value))}
                    className="w-full h-1 accent-brand-red"
                  />
                </Tooltip>
                <span className="text-xs text-gray-400 w-6 text-right tabular-nums">
                  {Math.round((source.volume ?? 1) * 100)}
                </span>
              </div>
            )}

            {/* Music source controls */}
            {source.type === 'music' && (
              <div className="px-3 pb-2.5 flex flex-col gap-1.5">
                <button
                  onClick={async () => {
                    const path = await open({ title: 'Choose audio', filters: [{ name: 'Audio', extensions: ['mp3','wav','ogg','flac','m4a','aac'] }], multiple: false }).catch(() => null)
                    if (!path || Array.isArray(path)) return
                    const bytes = await readBinaryFile(path as string).catch(() => null)
                    if (!bytes) return
                    const ext = (path as string).split('.').pop()?.toLowerCase() ?? 'mp3'
                    // Saved as its own file rather than embedded as base64 -- keeps project.json
                    // small regardless of file size, so toggling Loop/Monitor etc. stays instant.
                    const savedPath = await saveMediaFile(bytes, ext).catch(() => null)
                    if (!savedPath) return
                    const previous = source.audioFileSrc
                    onUpdateSource(source.id, { audioFileSrc: savedPath, name: (path as string).split(/[\\/]/).pop() ?? 'Music' })
                    if (previous) deleteMediaFile(previous)
                  }}
                  className="text-xs px-2 py-1.5 rounded-lg bg-surface-card dark:bg-surface-dark-card text-gray-600 dark:text-gray-400 hover:bg-surface-card-hover dark:hover:bg-surface-dark-card-hover transition-colors text-left truncate"
                >
                  {source.audioFileSrc ? `♪ ${source.name}` : '♪ Choose audio file…'}
                </button>
                <div className="flex items-center gap-2">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 flex-shrink-0"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
                  <input type="range" min={0} max={1} step={0.01} value={source.volume ?? 1} onChange={e => onChangeVolume(source.id, Number(e.target.value))} className="flex-1 h-1 accent-brand-red" />
                  <span className="text-xs text-gray-400 w-6 text-right tabular-nums">{Math.round((source.volume ?? 1) * 100)}</span>
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={source.loop ?? true} onChange={e => onUpdateSource(source.id, { loop: e.target.checked })} className="accent-brand-red" />
                    <span className="text-xs text-gray-500 dark:text-gray-400">Loop</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer" title="Hear music through your own speakers. Uncheck to send to stream only.">
                    <input type="checkbox" checked={source.monitor ?? true} onChange={e => onUpdateSource(source.id, { monitor: e.target.checked })} className="accent-brand-red" />
                    <span className="text-xs text-gray-500 dark:text-gray-400">Monitor</span>
                  </label>
                </div>
              </div>
            )}

            {/* BG removal */}
            {(source.type === 'camera' || source.type === 'avatar') && (
              <div className="px-3 pb-2">
                <Tooltip text="Remove your webcam background using AI, no green screen needed" position="top">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={source.bgRemoval ?? false}
                      onChange={e => onUpdateSource(source.id, { bgRemoval: e.target.checked })}
                      className="accent-brand-red"
                    />
                    <span className="text-xs text-gray-500 dark:text-gray-400">Remove background</span>
                    {source.bgRemoval && (
                      <span className="text-xs text-brand-red font-semibold ml-auto">AI</span>
                    )}
                  </label>
                </Tooltip>
              </div>
            )}

            {/* Camera picker */}
            {(source.type === 'camera' || source.type === 'avatar') && cameraDevices.length > 1 && (
              <div className="px-3 pb-2">
                <select
                  value={source.deviceId ?? ''}
                  onChange={e => onChangeCameraDevice(source.id, e.target.value)}
                  className="w-full text-xs bg-surface-card dark:bg-surface-dark-card border border-black/[0.08] dark:border-panel-glow rounded px-1.5 py-1 text-gray-600 dark:text-gray-400"
                >
                  {cameraDevices.map(d => (
                    <option key={d.deviceId} value={d.deviceId}>{d.label}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Browser source — file picker */}
            {source.type === 'browser' && (
              <div className="px-3 pb-2.5 flex flex-col gap-1.5">
                <button
                  onClick={async () => {
                    const path = await open({ title: 'Choose HTML file', filters: [{ name: 'HTML', extensions: ['html', 'htm'] }], multiple: false }).catch(() => null)
                    if (!path || Array.isArray(path)) return
                    onUpdateSource(source.id, { htmlPath: path as string })
                  }}
                  className="text-xs px-2 py-1.5 rounded-lg bg-surface-card dark:bg-surface-dark-card text-gray-600 dark:text-gray-400 hover:bg-surface-card-hover dark:hover:bg-surface-dark-card-hover transition-colors text-left truncate"
                >
                  {source.htmlPath
                    ? `⬡ ${(source.htmlPath as string).split(/[\\/]/).pop()}`
                    : '⬡ Choose HTML file…'}
                </button>
                {source.htmlPath && (
                  <button
                    onClick={() => {
                      // Force iframe reload by briefly clearing the path then restoring
                      const p = source.htmlPath
                      onUpdateSource(source.id, { htmlPath: undefined })
                      setTimeout(() => onUpdateSource(source.id, { htmlPath: p }), 50)
                    }}
                    className="text-xs text-gray-400 hover:text-brand-red transition-colors text-left"
                  >
                    ↺ Reload
                  </button>
                )}
              </div>
            )}

            {/* Screen capture tip: exclusive fullscreen games capture poorly — recommend Borderless Windowed */}
            {source.type === 'screen' && (
              <div className="mx-3 mb-2 flex items-start gap-2 px-3 py-2 bg-surface-card dark:bg-surface-dark-card border border-black/[0.08] dark:border-panel-glow rounded-md">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-secondary dark:text-text-dark-secondary flex-shrink-0 mt-0.5">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
                </svg>
                <p className="text-xs text-text-secondary dark:text-text-dark-secondary leading-snug">
                  <span className="font-semibold text-gray-700 dark:text-gray-300">Tip:</span> For games, use <span className="font-semibold text-gray-700 dark:text-gray-300">Borderless Windowed</span> mode for best capture quality.
                </p>
              </div>
            )}

            {/* Text controls */}
            {source.type === 'text' && (
              <div className="px-3 pb-2.5 flex flex-col gap-2">
                <Tooltip text="Change the text size" position="top">
                  <div className="pill-group w-full">
                    {([12, 16, 24, 36] as const).map(size => (
                      <button
                        key={size}
                        onClick={() => onUpdateSource(source.id, { fontSize: size })}
                        className={`pill flex-1 justify-center py-0.5 ${(source.fontSize ?? 16) === size ? 'pill-active' : ''}`}
                      >
                        {size === 12 ? 'XS' : size === 16 ? 'S' : size === 24 ? 'M' : 'L'}
                      </button>
                    ))}
                  </div>
                </Tooltip>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-400">Color</label>
                  <Tooltip text="Change text color" position="top">
                    <input
                      type="color"
                      value={source.color ?? '#ffffff'}
                      onChange={e => onUpdateSource(source.id, { color: e.target.value })}
                      className="w-7 h-5 rounded cursor-pointer border-0 bg-transparent"
                    />
                  </Tooltip>
                  <div className="flex-1" />
                  <Tooltip text="Makes the text scroll across the screen" position="left">
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={source.scrolling ?? false}
                        onChange={e => onUpdateSource(source.id, { scrolling: e.target.checked })}
                        className="accent-brand-red"
                      />
                      <span className="text-xs text-gray-400">Scroll</span>
                    </label>
                  </Tooltip>
                </div>
              </div>
            )}
          </div>
        ))}

        {sources.length === 0 && (
          <div className="px-3 py-4 text-xs text-gray-400 dark:text-gray-600 text-center">
            No sources yet
          </div>
        )}
      </div>

      {/* Add source library */}
      <div className="-mx-2.5 px-2.5 pt-2 border-t border-black/[0.08] dark:border-panel-glow flex flex-col gap-1.5 flex-shrink-0">
        <div className="section-label">Source Library</div>

        <button
          onClick={() => setLibraryOpen(o => !o)}
          className="accent-gradient-border-hover btn-solid flex items-center justify-center gap-1.5 w-full px-2.5 py-1.5 text-[11px]"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
          Add Source
        </button>

        {libraryOpen && (
          <>
            {renderDeviceGroup('Input Devices', INPUT_SOURCE_TYPES)}
            {renderDeviceGroup('Output Devices', OUTPUT_SOURCE_TYPES)}
            {renderDeviceGroup('Overlays', OVERLAY_SOURCE_TYPES)}
          </>
        )}
      </div>

    </div>
  )
}
