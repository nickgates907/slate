import { open } from '@tauri-apps/api/dialog'
import { readBinaryFile } from '@tauri-apps/api/fs'
import { Source } from '../store'
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
}

const typeIcon = (type: Source['type']) => {
  switch (type) {
    case 'camera':
      return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
    case 'screen':
      return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
    case 'avatar':
      return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
    case 'audio':
      return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
    case 'image':
      return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
    case 'text':
      return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>
    case 'music':
      return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
    case 'browser':
      return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
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
  { type: 'camera' as const,  label: 'Add camera', tip: 'Add your webcam to the scene' },
  { type: 'screen' as const,  label: 'Add screen', tip: 'Capture your entire screen or a game window' },
  { type: 'avatar' as const,  label: 'Add avatar', tip: 'Circular webcam — great for a face cam overlay' },
  { type: 'image'  as const,  label: 'Add image',  tip: 'Add a logo, overlay image, or graphic' },
  { type: 'audio'  as const,  label: 'Add mic',    tip: 'Add your microphone so viewers can hear you' },
  { type: 'text'   as const,  label: 'Add text',   tip: 'Add text to your scene — name, social handles, alerts' },
  { type: 'music'  as const,  label: 'Add music',  tip: 'Play background or intro music — loops and plays through the stream' },
  { type: 'browser' as const, label: 'Add browser source', tip: 'Load a local HTML file — animated overlays, visualizers, custom scenes' },
]

export default function SourcesPanel({
  sources, onToggleVisible, onAddSource, onRemoveSource, onReorderSource,
  onChangeCameraDevice, onChangeVolume, onUpdateSource, cameraDevices, audioLevel,
}: SourcesPanelProps) {
  return (
    <div className="w-52 flex flex-col bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 flex-shrink-0">

      <div className="px-3 pt-3 pb-1 text-xs font-bold text-gray-400 dark:text-gray-600 tracking-widest uppercase border-b border-gray-100 dark:border-gray-800">
        Sources
      </div>

      <div className="flex-1 overflow-y-auto">
        {sources.map((source) => (
          <div key={source.id} className="border-b border-gray-50 dark:border-gray-800">
            <div className="flex items-center gap-1.5 px-2 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">

              {/* Reorder arrows */}
              <div className="flex flex-col gap-px flex-shrink-0">
                <Tooltip text="Move up — sources higher in the list appear on top" position="left">
                  <button
                    onClick={() => onReorderSource(source.id, 'up')}
                    disabled={sources.indexOf(source) === 0}
                    className="text-gray-300 dark:text-gray-700 hover:text-gray-500 dark:hover:text-gray-400 disabled:opacity-20 transition-colors"
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
                  </button>
                </Tooltip>
                <Tooltip text="Move down — sources lower in the list appear behind" position="left">
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
                    const mime = ext === 'wav' ? 'audio/wav' : ext === 'ogg' ? 'audio/ogg' : 'audio/mpeg'
                    const blob = new Blob([bytes.buffer as ArrayBuffer], { type: mime })
                    const dataUrl = await new Promise<string>(res => { const r = new FileReader(); r.onload = () => res(r.result as string); r.readAsDataURL(blob) })
                    onUpdateSource(source.id, { audioFileSrc: dataUrl, name: (path as string).split(/[\\/]/).pop() ?? 'Music' })
                  }}
                  className="text-xs px-2 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-left truncate"
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
                <Tooltip text="Remove your webcam background using AI — no green screen needed" position="top">
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
                  className="w-full text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-1.5 py-1 text-gray-600 dark:text-gray-400"
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
                  className="text-xs px-2 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-left truncate"
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
              <div className="mx-3 mb-2 pl-2.5 pr-2 py-1.5 bg-gold-accent/5 border-l-[3px] border-gold-accent rounded-lg">
                <p className="text-xs text-amber-700 dark:text-amber-200/80 leading-snug">
                  <span className="font-semibold">Tip:</span> For games, use <span className="font-semibold">Borderless Windowed</span> mode for best capture quality.
                </p>
              </div>
            )}

            {/* Text controls */}
            {source.type === 'text' && (
              <div className="px-3 pb-2.5 flex flex-col gap-2">
                <Tooltip text="Change the text size" position="top">
                  <div className="flex items-center gap-1 w-full">
                    {([12, 16, 24, 36] as const).map(size => (
                      <button
                        key={size}
                        onClick={() => onUpdateSource(source.id, { fontSize: size })}
                        className={`flex-1 py-0.5 rounded text-xs font-semibold transition-colors ${
                          (source.fontSize ?? 16) === size
                            ? 'bg-brand-red text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
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

      {/* Add source buttons */}
      <div className="p-2 border-t border-gray-100 dark:border-gray-800 flex flex-col gap-1">
        {ADD_SOURCES.map(({ type, label, tip }) => (
          <Tooltip key={type} text={tip} position="left">
            <button
              onClick={() => onAddSource(type)}
              className="btn-secondary flex items-center gap-2 w-full px-2.5 py-1.5 text-xs text-left"
            >
              {typeIcon(type)}
              {label}
            </button>
          </Tooltip>
        ))}
      </div>

    </div>
  )
}
