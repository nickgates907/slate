import { useRef, useCallback } from 'react'
import { invoke } from '@tauri-apps/api/tauri'
import { videoRegistry } from '../lib/videoRegistry'
import { Scene } from '../store'

export function useStreamer() {
  const rafRef = useRef<number | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const sceneRef = useRef<Scene | null>(null)
  const activeRef = useRef(false)
  const bgImageRef = useRef<HTMLImageElement | null>(null)
  const bgImageSrcRef = useRef<string | null>(null)

  const start = useCallback(async (
    scene: Scene,
    previewEl: HTMLDivElement,
    rtmpUrls: string[],
    bitrate: number,
    fps: number,
    audioStream?: MediaStream,
  ): Promise<void> => {
    sceneRef.current = scene
    activeRef.current = true

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
          if (el instanceof HTMLVideoElement && el.readyState < 2) continue

          const dx = source.x * scaleX
          const dy = source.y * scaleY
          const dw = source.width * scaleX
          const dh = source.height * scaleY

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

      rafRef.current = requestAnimationFrame(draw)
    }
    draw()

    const canvasStream = canvas.captureStream(fps)
    if (audioStream) {
      audioStream.getAudioTracks().forEach(t => canvasStream.addTrack(t))
    }

    // Start one ffmpeg process per destination
    await invoke('start_stream', {
      rtmpUrls,
      bitrateKbps: bitrate * 1000,
      fps,
    })

    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
      ? 'video/webm;codecs=vp9,opus'
      : MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')
        ? 'video/webm;codecs=vp8,opus'
        : 'video/webm'

    const recorder = new MediaRecorder(canvasStream, {
      mimeType,
      videoBitsPerSecond: bitrate * 1_000_000,
      audioBitsPerSecond: 128_000,
    })

    recorder.ondataavailable = async (e) => {
      if (!activeRef.current || e.data.size === 0) return
      const buf = await e.data.arrayBuffer()
      // Convert to base64 in chunks to avoid call stack overflow on large buffers
      const bytes = new Uint8Array(buf)
      let b64 = ''
      const chunkSize = 8192
      for (let i = 0; i < bytes.length; i += chunkSize) {
        b64 += String.fromCharCode(...bytes.subarray(i, i + chunkSize))
      }
      invoke('send_stream_chunk', { data: btoa(b64) }).catch(console.error)
    }

    recorder.start(2000)
    recorderRef.current = recorder
  }, [])

  const updateScene = useCallback((scene: Scene) => {
    sceneRef.current = scene
  }, [])

  const stop = useCallback(async () => {
    activeRef.current = false

    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    sceneRef.current = null

    const recorder = recorderRef.current
    recorderRef.current = null

    if (recorder && recorder.state !== 'inactive') {
      await new Promise<void>(resolve => {
        recorder.onstop = () => resolve()
        recorder.stop()
      })
    }

    await invoke('stop_stream').catch(console.error)
  }, [])

  return { start, stop, updateScene }
}
