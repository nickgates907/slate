import React, { useRef, useState, useEffect } from 'react'
import { open } from '@tauri-apps/api/dialog'
import { readBinaryFile } from '@tauri-apps/api/fs'
import { Scene, Source, SceneBackground, defaultBackground } from '../store'
import VideoTile from './VideoTile'
import TextTile from './TextTile'
import MusicTile from './MusicTile'
import Tooltip from './Tooltip'

interface CanvasProps {
  scene: Scene
  isRecording: boolean
  recordingTime: string
  onUpdateSource: (sourceId: string, updates: Partial<Source>) => void
  onUpdateBackground: (bg: SceneBackground) => void
  previewRef: React.RefObject<HTMLDivElement>
  onExportLayout: () => void
  onImportLayout: () => void
  onOpenOverlays: () => void
  isActiveScene: boolean  // true = this scene is currently shown in preview
}

type ResizeHandle = 'nw' | 'ne' | 'sw' | 'se'

const RESIZE_HANDLES: Array<{ h: ResizeHandle; pos: string; cursor: string }> = [
  { h: 'nw', pos: '-top-1.5 -left-1.5', cursor: 'cursor-nw-resize' },
  { h: 'ne', pos: '-top-1.5 -right-1.5', cursor: 'cursor-ne-resize' },
  { h: 'sw', pos: '-bottom-1.5 -left-1.5', cursor: 'cursor-sw-resize' },
  { h: 'se', pos: '-bottom-1.5 -right-1.5', cursor: 'cursor-se-resize' },
]

export default function Canvas({
  scene, isRecording, recordingTime, onUpdateSource, onUpdateBackground, previewRef,
  onExportLayout, onImportLayout, onOpenOverlays, isActiveScene,
}: CanvasProps) {
  // ── Scene transition: fade out → swap → fade in when scene.id changes ──
  const [displayScene, setDisplayScene] = useState(scene)
  const [fadeOpacity, setFadeOpacity] = useState(1)
  const prevSceneIdRef = useRef(scene.id)

  useEffect(() => {
    if (scene.id === prevSceneIdRef.current) {
      // Same scene — update sources/bg live without any fade
      setDisplayScene(scene)
      return
    }
    // New scene — crossfade
    prevSceneIdRef.current = scene.id
    setFadeOpacity(0)
    const t = setTimeout(() => {
      setDisplayScene(scene)
      setFadeOpacity(1)
    }, 150)
    return () => clearTimeout(t)
  }, [scene])

  const bg = displayScene.background ?? defaultBackground
  const [showBgPicker, setShowBgPicker] = useState(false)
  const canvasRef = useRef<HTMLDivElement>(null)
  const letterboxRef = useRef<HTMLDivElement>(null)
  const [canvasDims, setCanvasDims] = useState<{ width: number; height: number } | null>(null)

  useEffect(() => {
    const el = letterboxRef.current
    if (!el) return
    const obs = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        const containerAspect = width / height
        if (containerAspect > 16 / 9) {
          setCanvasDims({ width: height * (16 / 9), height })
        } else {
          setCanvasDims({ width, height: width * (9 / 16) })
        }
      }
    })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const dragging = useRef<{
    id: string; startX: number; startY: number; origX: number; origY: number
  } | null>(null)

  const resizing = useRef<{
    id: string; handle: ResizeHandle
    startX: number; startY: number
    origX: number; origY: number; origW: number; origH: number
    isSquare: boolean
  } | null>(null)

  const handleMouseDown = (e: React.MouseEvent, source: Source) => {
    e.preventDefault()
    dragging.current = {
      id: source.id, startX: e.clientX, startY: e.clientY,
      origX: source.x, origY: source.y,
    }

    const onMove = (ev: MouseEvent) => {
      if (!dragging.current) return
      const dx = ev.clientX - dragging.current.startX
      const dy = ev.clientY - dragging.current.startY
      onUpdateSource(dragging.current.id, {
        x: Math.max(0, dragging.current.origX + dx),
        y: Math.max(0, dragging.current.origY + dy),
      })
    }
    const onUp = () => {
      dragging.current = null
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  const handleResizeStart = (e: React.MouseEvent, source: Source, handle: ResizeHandle) => {
    e.preventDefault()
    e.stopPropagation()
    resizing.current = {
      id: source.id, handle,
      startX: e.clientX, startY: e.clientY,
      origX: source.x, origY: source.y,
      origW: source.width, origH: source.height,
      isSquare: source.type === 'avatar',
    }

    const onMove = (ev: MouseEvent) => {
      if (!resizing.current) return
      const { handle: h, startX, startY, origX, origY, origW, origH, id, isSquare } = resizing.current
      const dx = ev.clientX - startX
      const dy = ev.clientY - startY
      const MIN = 40

      let newX = origX, newY = origY, newW = origW, newH = origH

      if (h === 'se') { newW = Math.max(MIN, origW + dx); newH = Math.max(MIN, origH + dy) }
      else if (h === 'sw') { newX = origX + dx; newW = Math.max(MIN, origW - dx); newH = Math.max(MIN, origH + dy) }
      else if (h === 'ne') { newY = origY + dy; newW = Math.max(MIN, origW + dx); newH = Math.max(MIN, origH - dy) }
      else if (h === 'nw') { newX = origX + dx; newY = origY + dy; newW = Math.max(MIN, origW - dx); newH = Math.max(MIN, origH - dy) }

      // Lock avatar to square
      if (isSquare) { const s = Math.max(newW, newH); newW = s; newH = s }

      onUpdateSource(id, { x: newX, y: newY, width: newW, height: newH })
    }
    const onUp = () => {
      resizing.current = null
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  const pickImage = async (sourceId: string) => {
    const path = await open({
      title: 'Choose image',
      filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'] }],
      multiple: false,
    })
    if (!path || Array.isArray(path)) return
    const filePath = path as string
    const isSvg = filePath.toLowerCase().endsWith('.svg')
    const bytes = await readBinaryFile(filePath)
    const blob = new Blob([bytes.buffer as ArrayBuffer], { type: isSvg ? 'image/svg+xml' : undefined })
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
    onUpdateSource(sourceId, { imageSrc: dataUrl })
  }

  const visibleSources = displayScene.sources.filter(s => s.visible && s.type !== 'audio' && s.type !== 'music')
  const musicSources   = displayScene.sources.filter(s => s.type === 'music')

  return (
    <div className="flex-1 flex flex-col min-w-0">

      {/* Preview — outer letterbox */}
      <div ref={letterboxRef} className="flex-1 m-3 mb-0 rounded-xl bg-gray-950 flex items-center justify-center relative overflow-hidden">

        <span className="absolute top-2.5 left-3 z-10 text-xs text-white font-bold tracking-widest uppercase pointer-events-none bg-white/10 px-2.5 py-1 rounded-md">
          Preview
        </span>

        {isRecording && (
          <div className="absolute top-2.5 right-3 z-10 flex items-center gap-1.5 bg-brand-red text-white text-xs font-bold px-3 py-1 rounded-full">
            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
            {recordingTime}
          </div>
        )}

        {/* 16:9 canvas — matches YouTube / 1920×1080 output exactly */}
        <div
          className="relative overflow-visible flex-shrink-0"
          style={{
            ...(canvasDims ? { width: canvasDims.width, height: canvasDims.height } : { width: '100%', aspectRatio: '16/9' }),
            ...(bg.type === 'image' && bg.imageSrc
              ? { backgroundImage: `url(${bg.imageSrc})`, backgroundSize: 'cover', backgroundPosition: 'center' }
              : { backgroundColor: bg.color }),
            opacity: fadeOpacity,
            transition: 'opacity 150ms ease',
          }}
        >

          {/* Sources container */}
          <div
            ref={(el) => {
              (canvasRef as React.MutableRefObject<HTMLDivElement | null>).current = el
              ;(previewRef as React.MutableRefObject<HTMLDivElement | null>).current = el
            }}
            className="absolute inset-0 overflow-hidden"
          >
            {visibleSources.map((source) => {
              const isAvatar = source.type === 'avatar'
              const isBottomText = source.type === 'text' && source.anchor === 'bottom'

              // Bottom-anchored text spans the full width — no wrapper, no resize handles
              if (isBottomText) {
                return (
                  <div
                    key={source.id}
                    className="absolute left-0 right-0 bottom-0"
                    style={{ height: source.height || 40 }}
                  >
                    <TextTile
                      source={source}
                      onUpdate={(updates) => onUpdateSource(source.id, updates)}
                    />
                  </div>
                )
              }

              // All other sources: positioned wrapper + resize handles
              return (
                <div
                  key={source.id}
                  className="absolute group cursor-move select-none"
                  style={{ left: source.x, top: source.y, width: source.width, height: source.height }}
                  onMouseDown={(e) => handleMouseDown(e, source)}
                >
                  {/* Content clipped to source bounds */}
                  <div
                    className="absolute inset-0 overflow-hidden border border-white/15 group-hover:border-brand-red transition-colors"
                    style={{ borderRadius: isAvatar ? '50%' : '0.5rem' }}
                  >
                    {(source.type === 'camera' || source.type === 'screen' || source.type === 'avatar') && (
                      <VideoTile source={source} />
                    )}

                    {source.type === 'text' && (
                      <TextTile
                        source={source}
                        onUpdate={(updates) => onUpdateSource(source.id, updates)}
                      />
                    )}

                    {source.type === 'image' && (
                      source.imageSrc
                        ? <img src={source.imageSrc} className="w-full h-full object-contain" draggable={false} />
                        : (
                          <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-white/5 text-white/40">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                            </svg>
                            <button
                              onMouseDown={e => e.stopPropagation()}
                              onClick={() => pickImage(source.id)}
                              className="px-3 py-1.5 bg-brand-red text-white text-xs font-semibold rounded-lg hover:bg-red-500 transition-colors"
                            >
                              Choose image
                            </button>
                          </div>
                        )
                    )}
                  </div>

                  {/* Resize handles — 4 corners */}
                  {RESIZE_HANDLES.map(({ h, pos, cursor }) => (
                    <div
                      key={h}
                      className={`absolute ${pos} w-3 h-3 bg-white rounded-sm border border-gray-400 ${cursor} opacity-0 group-hover:opacity-100 z-10 transition-opacity`}
                      onMouseDown={(e) => handleResizeStart(e, source, h)}
                    />
                  ))}
                </div>
              )
            })}
          </div>

          {visibleSources.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-white/20 text-sm">
              No sources — add one from the panel →
            </div>
          )}

          {/* Music sources — invisible audio players, play when this scene is active */}
          {musicSources.map(src => (
            <MusicTile
              key={src.id}
              sourceId={src.id}
              audioFileSrc={src.audioFileSrc}
              volume={src.volume ?? 1}
              loop={src.loop ?? true}
              playing={isActiveScene && src.visible}
            />
          ))}
        </div>
      </div>

      {/* Background picker popover */}
      {showBgPicker && (
        <BgPicker
          bg={bg}
          onChange={onUpdateBackground}
          onClose={() => setShowBgPicker(false)}
        />
      )}

      {/* Bottom toolbar */}
      <div className="flex items-center gap-2 px-3 py-2">
        <Tooltip text="Change the scene background color or image" position="top">
          <button
            onClick={() => setShowBgPicker(p => !p)}
            className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <span className="w-3 h-3 rounded-sm border border-gray-300 flex-shrink-0" style={{ backgroundColor: bg.type === 'color' ? bg.color : undefined, backgroundImage: bg.type === 'image' && bg.imageSrc ? `url(${bg.imageSrc})` : undefined, backgroundSize: 'cover' }} />
            Background
          </button>
        </Tooltip>
        <Tooltip text="Save your scene layout to share with others or keep as a backup" position="top">
          <button onClick={onExportLayout} className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/>
            </svg>
            Save layout
          </button>
        </Tooltip>
        <Tooltip text="Load a previously saved scene layout" position="top">
          <button onClick={onImportLayout} className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            Import
          </button>
        </Tooltip>
        <Tooltip text="Browse pre-made overlay templates — alerts, panels, and more" position="top">
          <button onClick={onOpenOverlays} className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
            Overlays
          </button>
        </Tooltip>
        <div className="flex-1" />
        <span className="text-xs text-gray-400 dark:text-gray-600">1920 × 1080 · 30fps</span>
      </div>

    </div>
  )
}

// ── Background picker ─────────────────────────────────────────────────────────

function BgPicker({ bg, onChange, onClose }: { bg: SceneBackground; onChange: (bg: SceneBackground) => void; onClose: () => void }) {
  const pickImage = async () => {
    const path = await open({
      title: 'Choose background image',
      filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'] }],
      multiple: false,
    })
    if (!path || Array.isArray(path)) return
    const filePath = path as string
    const isSvg = filePath.toLowerCase().endsWith('.svg')
    const bytes = await readBinaryFile(filePath)
    const blob = new Blob([bytes.buffer as ArrayBuffer], { type: isSvg ? 'image/svg+xml' : undefined })
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
    onChange({ ...bg, type: 'image', imageSrc: dataUrl })
    onClose()
  }

  return (
    <div className="absolute bottom-12 left-3 z-20 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-4 w-56">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Background</span>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
      </div>

      {/* Color picker */}
      <div className="flex items-center gap-2 mb-3">
        <input
          type="color"
          value={bg.color}
          onChange={e => onChange({ type: 'color', color: e.target.value })}
          className="w-8 h-8 rounded cursor-pointer border border-gray-200 dark:border-gray-700 bg-transparent"
        />
        <span className="text-xs text-gray-500 dark:text-gray-400">Solid color</span>
        {bg.type === 'color' && <span className="ml-auto text-xs text-brand-red font-semibold">Active</span>}
      </div>

      {/* Preset colors */}
      <div className="flex gap-1.5 mb-3">
        {['#000000', '#1a1a2e', '#0f3460', '#16213e', '#1b1b2f', '#2d132c'].map(c => (
          <button
            key={c}
            onClick={() => onChange({ type: 'color', color: c })}
            className="w-6 h-6 rounded-md border-2 transition-all"
            style={{ backgroundColor: c, borderColor: bg.color === c ? '#ef4444' : 'transparent' }}
          />
        ))}
      </div>

      {/* Image */}
      <div className="border-t border-gray-100 dark:border-gray-800 pt-3 space-y-2">
        <button
          onClick={pickImage}
          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
          </svg>
          {bg.type === 'image' ? 'Change image' : 'Choose image'}
        </button>
        {bg.type === 'image' && (
          <button
            onClick={() => onChange({ type: 'color', color: bg.color })}
            className="w-full text-xs text-gray-400 hover:text-red-400 transition-colors"
          >
            Remove image
          </button>
        )}
      </div>
    </div>
  )
}
