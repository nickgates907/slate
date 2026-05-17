import { useRef, useCallback } from 'react'
import { writeBinaryFile, createDir } from '@tauri-apps/api/fs'
import { join, documentDir } from '@tauri-apps/api/path'
import { videoRegistry } from '../lib/videoRegistry'
import { Scene } from '../store'

export interface RecordingResult {
  blobUrl: string
  blob: Blob
  durationSecs: number
}

export function useRecorder() {
  const rafRef = useRef<number | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const sceneRef = useRef<Scene | null>(null)
  const startTimeRef = useRef<number>(0)

  const bgImageRef = useRef<HTMLImageElement | null>(null)
  const bgImageSrcRef = useRef<string | null>(null)

  const start = useCallback((scene: Scene, previewEl: HTMLDivElement, audioStream?: MediaStream) => {
    sceneRef.current = scene
    startTimeRef.current = Date.now()

    const previewW = previewEl.offsetWidth || 640
    const previewH = previewEl.offsetHeight || 360
    const outW = 1920
    const outH = 1080
    const scaleX = outW / previewW
    const scaleY = outH / previewH

    const canvas = document.createElement('canvas')
    canvas.width = outW
    canvas.height = outH
    const ctx = canvas.getContext('2d')!

    const draw = () => {
      const s = sceneRef.current
      const bg = s?.background
      if (bg?.type === 'image' && bg.imageSrc) {
        if (bg.imageSrc !== bgImageSrcRef.current) {
          const img = new Image()
          img.src = bg.imageSrc
          bgImageRef.current = img
          bgImageSrcRef.current = bg.imageSrc
        }
        if (bgImageRef.current?.complete) {
          ctx.drawImage(bgImageRef.current, 0, 0, outW, outH)
        } else {
          ctx.fillStyle = '#000'
          ctx.fillRect(0, 0, outW, outH)
        }
      } else {
        ctx.fillStyle = bg?.color ?? '#000'
        ctx.fillRect(0, 0, outW, outH)
      }

      if (s) {
        for (const source of s.sources) {
          if (!source.visible || source.type === 'audio' || source.type === 'image' || source.type === 'text') continue
          const el = videoRegistry.get(source.id)
          if (!el) continue
          // HTMLVideoElement needs readyState check; HTMLCanvasElement is always ready
          if (el instanceof HTMLVideoElement && el.readyState < 2) continue
          const video = el

          const dx = source.x * scaleX
          const dy = source.y * scaleY
          const dw = source.width * scaleX
          const dh = source.height * scaleY

          if (source.type === 'avatar') {
            ctx.save()
            ctx.beginPath()
            ctx.arc(dx + dw / 2, dy + dh / 2, Math.min(dw, dh) / 2, 0, Math.PI * 2)
            ctx.clip()
            ctx.drawImage(video, dx, dy, dw, dh)
            ctx.restore()
          } else {
            ctx.drawImage(video, dx, dy, dw, dh)
          }
        }
      }

      rafRef.current = requestAnimationFrame(draw)
    }
    draw()

    const canvasStream = canvas.captureStream(30)
    if (audioStream) {
      audioStream.getAudioTracks().forEach(t => canvasStream.addTrack(t))
    }

    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
      ? 'video/webm;codecs=vp9,opus'
      : MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')
        ? 'video/webm;codecs=vp8,opus'
        : 'video/webm'

    // 8 Mbps video — matches YouTube's recommended 1080p upload bitrate
    const recorder = new MediaRecorder(canvasStream, {
      mimeType,
      videoBitsPerSecond: 8_000_000,
      audioBitsPerSecond: 128_000,
    })
    chunksRef.current = []
    recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
    recorder.start(500)
    recorderRef.current = recorder
  }, [])

  const updateScene = useCallback((scene: Scene) => {
    sceneRef.current = scene
  }, [])

  const stop = useCallback((): Promise<RecordingResult | null> => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    sceneRef.current = null

    const recorder = recorderRef.current
    if (!recorder) return Promise.resolve(null)
    recorderRef.current = null

    const durationSecs = Math.round((Date.now() - startTimeRef.current) / 1000)

    return new Promise((resolve) => {
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' })
        const blobUrl = URL.createObjectURL(blob)
        resolve({ blobUrl, blob, durationSecs })
      }
      recorder.stop()
    })
  }, [])

  return { start, stop, updateScene }
}

export async function saveRecording(blob: Blob, customFolder?: string): Promise<string> {
  const ts = new Date().toISOString().slice(0, 19).replace('T', ' ').replace(/:/g, '-')
  const filename = `Slate ${ts}.webm`
  const dir = customFolder || await join(await documentDir(), 'Slate Recordings')
  await createDir(dir, { recursive: true })
  const fullPath = await join(dir, filename)
  await writeBinaryFile(fullPath, new Uint8Array(await blob.arrayBuffer()))
  return fullPath
}
