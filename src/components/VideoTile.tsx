import { useEffect, useRef, useState, memo } from 'react'
import { SelfieSegmentation, Results } from '@mediapipe/selfie_segmentation'
import { Source } from '../store'
import { videoRegistry } from '../lib/videoRegistry'
import { streamRegistry, screenRegistry } from '../lib/streamRegistry'

type StreamState = 'loading' | 'active' | 'idle' | 'error'

interface VideoTileProps {
  source: Source
}

function VideoTile({ source }: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const segRef = useRef<SelfieSegmentation | null>(null)
  const rafRef = useRef<number | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [streamState, setStreamState] = useState<StreamState>(
    source.type === 'screen' ? 'idle' : 'loading'
  )
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [noAudioWarning, setNoAudioWarning] = useState(false)

  // Camera / avatar: acquire from shared registry (instant on scene switch)
  useEffect(() => {
    if (source.type !== 'camera' && source.type !== 'avatar') return

    let cancelled = false

    streamRegistry.acquire(source.deviceId).then(stream => {
      if (cancelled) { streamRegistry.release(source.deviceId); return }
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play().catch(() => {})
      }
      setStreamState('active')
    }).catch(err => {
      if (!cancelled) {
        setErrorMsg(err instanceof Error ? err.message : 'Camera unavailable')
        setStreamState('error')
      }
    })

    return () => {
      cancelled = true
      streamRegistry.release(source.deviceId)
      streamRef.current = null
    }
  }, [source.type, source.deviceId])

  // Register the right element with videoRegistry and run BG removal if enabled
  useEffect(() => {
    if (streamState !== 'active') return
    if (source.type !== 'camera' && source.type !== 'avatar') return

    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    if (source.bgRemoval) {
      // BG removal: process frames through MediaPipe, register canvas
      const seg = new SelfieSegmentation({
        locateFile: (file) => `/mediapipe/${file}`,
      })
      seg.setOptions({ modelSelection: 1 }) // landscape model — better quality
      seg.onResults((results: Results) => {
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        canvas.width = results.image.width
        canvas.height = results.image.height

        // Mask: copy segmentation map then overlay the person pixels
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.globalCompositeOperation = 'copy'
        ctx.filter = 'blur(3px)'
        ctx.drawImage(results.segmentationMask, 0, 0, canvas.width, canvas.height)
        ctx.globalCompositeOperation = 'source-in'
        ctx.filter = 'none'
        ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height)
      })
      seg.initialize().then(() => {
        segRef.current = seg
        videoRegistry.register(source.id, canvas)

        const sendFrames = async () => {
          if (video.readyState >= 2 && segRef.current) {
            await segRef.current.send({ image: video }).catch(() => {})
          }
          // Cap at 20fps — rAF at 60fps wastes CPU for a preview effect
          rafRef.current = setTimeout(sendFrames, 50) as unknown as number
        }
        sendFrames()
      }).catch(() => {
        // Fall back to raw video if MediaPipe fails to load
        videoRegistry.register(source.id, video)
      })
    } else {
      // Raw feed: register video directly
      videoRegistry.register(source.id, video)
    }

    return () => {
      videoRegistry.unregister(source.id)
      if (rafRef.current !== null) { clearTimeout(rafRef.current); rafRef.current = null }
      segRef.current?.close()
      segRef.current = null
    }
  }, [source.id, source.type, source.bgRemoval, streamState])

  // Screen capture: one GLOBAL stream shared across all scenes.
  // VideoTile only manages video registration (per sourceId for the canvas renderer).
  // Audio is owned by screenRegistry under '__screen__' and never touched here.
  useEffect(() => {
    if (source.type !== 'screen') return

    const existing = screenRegistry.get(source.id)
    if (existing) {
      streamRef.current = existing
      if (videoRef.current) {
        videoRef.current.srcObject = existing
        videoRef.current.play().catch(() => {})
      }
      // Register video only — audio is managed globally by screenRegistry
      videoRegistry.register(source.id, videoRef.current!)
      setStreamState('active')
    }

    return () => {
      // Only unregister video — never touch audio (it lives in screenRegistry)
      videoRegistry.unregister(source.id)
      streamRef.current = null
    }
  }, [source.id, source.type])  // eslint-disable-line react-hooks/exhaustive-deps

  const startScreenCapture = async () => {
    setStreamState('loading')
    try {
      // displaySurface: 'monitor' hints the OS picker to default to "Entire Screen" --
      // the only option Windows/Chromium actually offers system audio for. systemAudio:
      // 'include' hints the "Also share system audio" toggle to default on, since it's
      // a separate opt-in even when Entire Screen is already selected.
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: 'monitor' } as MediaTrackConstraints,
        audio: { systemAudio: 'include' } as MediaTrackConstraints,
      })
      streamRef.current = stream
      // screenRegistry.set() handles audio registration under '__screen__'
      screenRegistry.set(source.id, stream)
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play().catch(() => {})
        videoRegistry.register(source.id, videoRef.current)
      }
      setStreamState('active')
      // Windows/Chromium only offers system audio when sharing the entire screen --
      // picking a specific window silently omits it, so warn the user right away.
      if (stream.getAudioTracks().length === 0) {
        setNoAudioWarning(true)
        setTimeout(() => setNoAudioWarning(false), 8000)
      }
      // When user clicks "Stop sharing" in the browser bar
      stream.getVideoTracks()[0]?.addEventListener('ended', () => {
        videoRegistry.unregister(source.id)
        setStreamState('idle')
        streamRef.current = null
        // Note: screenRegistry cleans up audio automatically via its own 'ended' listener
      })
    } catch {
      setStreamState('idle')
    }
  }

  const isAvatar = source.type === 'avatar'

  return (
    <div className="relative w-full h-full">
      {/* Hidden video — always captures the raw stream */}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className={`w-full h-full object-cover ${
          streamState === 'active' && !source.bgRemoval ? '' : 'hidden'
        }`}
      />

      {/* BG-removed canvas — shown when bgRemoval is on */}
      {source.bgRemoval && (
        <canvas
          ref={canvasRef}
          className={`w-full h-full object-cover ${streamState === 'active' ? '' : 'hidden'}`}
          style={{ background: 'transparent' }}
        />
      )}

      {/* Non-active overlay */}
      {streamState !== 'active' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/80">
          {streamState === 'loading' && (
            <>
              <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              {!isAvatar && <span className="text-white/40 text-xs">Starting...</span>}
            </>
          )}
          {streamState === 'idle' && source.type === 'screen' && (
            <button
              onMouseDown={e => e.stopPropagation()}
              onClick={startScreenCapture}
              className="px-3 py-1.5 bg-brand-red text-white text-xs font-semibold rounded-lg hover:bg-red-500 transition-colors"
            >
              Select screen
            </button>
          )}
          {streamState === 'idle' && isAvatar && (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.4">
              <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
            </svg>
          )}
          {streamState === 'error' && (
            <span className="text-red-400 text-xs text-center px-3">{errorMsg}</span>
          )}
          {!isAvatar && (
            <span className="text-white/60 text-xs font-semibold tracking-wide">{source.name}</span>
          )}
        </div>
      )}

      {/* Warning: screen share has no audio track (window capture, not entire screen) */}
      {streamState === 'active' && noAudioWarning && (
        <div className="absolute top-0 left-0 right-0 px-2 py-1.5 bg-amber-500/90 text-black text-xs font-semibold text-center pointer-events-none">
          No audio captured. Choose "Entire Screen" instead of a window to include game sound.
        </div>
      )}

      {/* Name strip over live feed */}
      {streamState === 'active' && !isAvatar && (
        <div className="absolute bottom-0 left-0 right-0 px-2 py-1 bg-black/40 pointer-events-none">
          <span className="text-white/70 text-xs font-semibold">{source.name}</span>
        </div>
      )}
    </div>
  )
}

// Only re-render when the props that affect video setup actually change (not x/y/width/height)
export default memo(VideoTile, (prev, next) =>
  prev.source.id        === next.source.id &&
  prev.source.type      === next.source.type &&
  prev.source.deviceId  === next.source.deviceId &&
  prev.source.bgRemoval === next.source.bgRemoval &&
  prev.source.visible   === next.source.visible &&
  prev.source.name      === next.source.name
)
