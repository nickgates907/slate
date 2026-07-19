import { useRef, useCallback } from 'react'
import { writeBinaryFile, createDir } from '@tauri-apps/api/fs'
import { join, documentDir } from '@tauri-apps/api/path'
import { videoRegistry } from '../lib/videoRegistry'
import { browserFrameRegistry } from '../lib/browserFrameRegistry'
import { drawAlert } from '../lib/drawAlert'
import { ActiveAlert } from './useAlerts'
import { Scene } from '../store'

type MutRef<T> = { current: T }

export interface RecordingResult {
  blobUrl: string
  blob: Blob
  durationSecs: number
}

const RES = {
  '720p':  { w: 1280, h: 720 },
  '1080p': { w: 1920, h: 1080 },
  '1440p': { w: 2560, h: 1440 },
}

export function useRecorder() {
  const rafRef = useRef<number | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const sceneRef = useRef<Scene | null>(null)
  const startTimeRef = useRef<number>(0)

  const bgImageRef = useRef<HTMLImageElement | null>(null)
  const bgImageSrcRef = useRef<string | null>(null)

  const alertRef = useRef<MutRef<ActiveAlert | null> | null>(null)

  const start = useCallback((
    scene: Scene,
    previewEl: HTMLDivElement,
    resolution: '720p' | '1080p' | '1440p',
    audioStream?: MediaStream,
    alertRefArg?: MutRef<ActiveAlert | null>,
    fps: 30 | 60 = 30,
    bitrateMbps: number = 8,
  ) => {
    alertRef.current = alertRefArg ?? null
    sceneRef.current = scene
    startTimeRef.current = Date.now()

    const previewW = previewEl.offsetWidth || 640
    const previewH = previewEl.offsetHeight || 360
    const { w: outW, h: outH } = RES[resolution] ?? RES['1080p']
    const scaleX = outW / previewW
    const scaleY = outH / previewH

    const canvas = document.createElement('canvas')
    canvas.width = outW
    canvas.height = outH
    const ctx = canvas.getContext('2d')!

    const imgCache = new Map<string, HTMLImageElement>()
    const scrollOffsets = new Map<string, number>()

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
          if (!source.visible || source.type === 'audio') continue

          const dx = source.x * scaleX
          const dy = source.y * scaleY
          const dw = source.width * scaleX
          const dh = source.height * scaleY

          if (source.type === 'image') {
            if (!source.imageSrc) continue
            let img = imgCache.get(source.id)
            if (!img || (img as any)._src !== source.imageSrc) {
              const newImg = new Image()
              newImg.src = source.imageSrc
              ;(newImg as any)._src = source.imageSrc
              imgCache.set(source.id, newImg)
              img = newImg
            }
            if (img.complete && img.naturalWidth > 0) {
              ctx.drawImage(img, dx, dy, dw, dh)
            }
            continue
          }

          if (source.type === 'text' && source.text) {
            const isBottom = source.anchor === 'bottom'
            const tx = isBottom ? 0 : dx
            const ty = isBottom ? outH - dh : dy
            const tw = isBottom ? outW : dw
            const scaledFont = (source.fontSize ?? 16) * scaleX

            ctx.fillStyle = 'rgba(0,0,0,0.6)'
            ctx.fillRect(tx, ty, tw, dh)

            ctx.font = `600 ${scaledFont}px sans-serif`
            ctx.fillStyle = source.color ?? '#ffffff'
            ctx.save()
            ctx.beginPath()
            ctx.rect(tx, ty, tw, dh)
            ctx.clip()

            if (source.scrolling) {
              const offset = scrollOffsets.get(source.id) ?? 0
              const measured = ctx.measureText(source.text).width + 80 * scaleX
              ctx.fillText(source.text, tx + 8 * scaleX - offset, ty + scaledFont * 1.1)
              ctx.fillText(source.text, tx + 8 * scaleX - offset + measured, ty + scaledFont * 1.1)
              scrollOffsets.set(source.id, (offset + 2) % measured)
            } else {
              ctx.fillText(source.text, tx + 8 * scaleX, ty + scaledFont * 1.1)
            }

            ctx.restore()
            continue
          }

          if (source.type === 'browser') {
            const bitmap = browserFrameRegistry.get(source.id)
            if (bitmap) ctx.drawImage(bitmap, dx, dy, dw, dh)
            continue
          }

          // Video sources (camera, screen, avatar)
          const el = videoRegistry.get(source.id)
          if (!el) continue
          if (el instanceof HTMLVideoElement && el.readyState < 2) continue

          if (source.type === 'avatar') {
            ctx.save()
            ctx.beginPath()
            ctx.arc(dx + dw / 2, dy + dh / 2, Math.min(dw, dh) / 2, 0, Math.PI * 2)
            ctx.clip()
            ctx.drawImage(el, dx, dy, dw, dh)
            ctx.restore()
          } else {
            ctx.drawImage(el, dx, dy, dw, dh)
          }
        }
      }

      if (alertRef.current?.current) drawAlert(ctx, alertRef.current.current, outW, outH)
      rafRef.current = requestAnimationFrame(draw)
    }
    draw()

    const canvasStream = canvas.captureStream(fps)
    if (audioStream) {
      audioStream.getAudioTracks().forEach(t => canvasStream.addTrack(t))
    }

    // VP8 encodes ~3× faster than VP9 with minimal quality difference at recording bitrates
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')
      ? 'video/webm;codecs=vp8,opus'
      : MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
        ? 'video/webm;codecs=vp9,opus'
        : 'video/webm'

    const recorder = new MediaRecorder(canvasStream, {
      mimeType,
      videoBitsPerSecond: bitrateMbps * 1_000_000,
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
