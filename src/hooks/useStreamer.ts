import { useRef, useCallback } from 'react'
import { invoke } from '@tauri-apps/api/tauri'
import { Muxer, StreamTarget } from 'webm-muxer'
import { videoRegistry } from '../lib/videoRegistry'
import { Scene } from '../store'
import { ActiveAlert } from './useAlerts'
import { drawAlert } from '../lib/drawAlert'

const RES = {
  '720p':  { w: 1280, h: 720 },
  '1080p': { w: 1920, h: 1080 },
  '1440p': { w: 2560, h: 1440 },
}

// Returns the best H.264 codec string supported by this hardware, or null if unavailable.
async function pickH264Codec(width: number, height: number, bitrate: number, fps: number): Promise<string | null> {
  if (typeof VideoEncoder === 'undefined') return null
  for (const codec of ['avc1.640028', 'avc1.4d001f', 'avc1.42001f']) {
    try {
      const { supported } = await VideoEncoder.isConfigSupported({
        codec, width, height, bitrate, framerate: fps, hardwareAcceleration: 'prefer-hardware',
      })
      if (supported) return codec
    } catch { /* unsupported */ }
  }
  return null
}

function drawScene(
  ctx: CanvasRenderingContext2D,
  scene: Scene | null,
  outW: number,
  outH: number,
  scaleX: number,
  scaleY: number,
  imgCache: Map<string, HTMLImageElement>,
  scrollOffsets: Map<string, number>,
  bgImageRef: React.MutableRefObject<HTMLImageElement | null>,
  bgImageSrcRef: React.MutableRefObject<string | null>,
) {
  const bg = scene?.background
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

  if (!scene) return

  for (const source of scene.sources) {
    if (!source.visible || source.type === 'audio') continue

    const dx = source.x * scaleX
    const dy = source.y * scaleY
    const dw = source.width * scaleX
    const dh = source.height * scaleY

    if (source.type === 'image') {
      if (!source.imageSrc) continue
      let img = imgCache.get(source.id)
      if (!img || (img as HTMLImageElement & { _src?: string })._src !== source.imageSrc) {
        const newImg = Object.assign(new Image(), { _src: source.imageSrc })
        newImg.src = source.imageSrc
        imgCache.set(source.id, newImg)
        img = newImg
      }
      if (img.complete && img.naturalWidth > 0) ctx.drawImage(img, dx, dy, dw, dh)
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

// Needed because React.MutableRefObject isn't importable here without React in scope
type MutRef<T> = { current: T }

export function useStreamer() {
  const rafRef = useRef<number | null>(null)
  const sceneRef = useRef<Scene | null>(null)
  const activeRef = useRef(false)
  const bgImageRef = useRef<HTMLImageElement | null>(null)
  const bgImageSrcRef = useRef<string | null>(null)

  // Binary WebSocket IPC — raw Uint8Array frames go directly to Rust→ffmpeg stdin
  const wsRef = useRef<WebSocket | null>(null)

  // WebCodecs path refs
  const videoEncoderRef = useRef<VideoEncoder | null>(null)
  const audioEncoderRef = useRef<AudioEncoder | null>(null)
  const muxerRef = useRef<Muxer<StreamTarget> | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const workletNodeRef = useRef<AudioWorkletNode | null>(null)

  // VP8 fallback ref
  const recorderRef = useRef<MediaRecorder | null>(null)

  const start = useCallback(async (
    scene: Scene,
    previewEl: HTMLDivElement,
    rtmpUrls: string[],
    bitrate: number,
    fps: number,
    resolution: '720p' | '1080p' | '1440p',
    audioStream?: MediaStream,
    alertRef?: MutRef<ActiveAlert | null>,
  ): Promise<void> => {
    sceneRef.current = scene
    activeRef.current = true

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

    const bgImgRef = bgImageRef as MutRef<HTMLImageElement | null>
    const bgImgSrcRef = bgImageSrcRef as MutRef<string | null>

    const h264Codec = await pickH264Codec(outW, outH, bitrate * 1_000_000, fps)

    await invoke('start_stream', {
      rtmpUrls,
      bitrateKbps: bitrate * 1000,
      fps,
      copyVideo: h264Codec !== null,
    })

    // Connect binary WebSocket to Rust IPC server (bound synchronously inside start_stream)
    const ws = await new Promise<WebSocket>((resolve, reject) => {
      const sock = new WebSocket('ws://127.0.0.1:9737')
      sock.binaryType = 'arraybuffer'
      sock.onopen = () => resolve(sock)
      sock.onerror = () => reject(new Error('Could not connect to stream IPC server'))
      setTimeout(() => reject(new Error('Stream IPC connection timed out')), 3000)
    })
    wsRef.current = ws

    // Send a raw binary chunk directly over the WebSocket — no base64 overhead
    const sendChunk = (data: Uint8Array) => {
      if (!activeRef.current) return
      const sock = wsRef.current
      if (sock && sock.readyState === WebSocket.OPEN) sock.send(data)
    }

    if (h264Codec !== null) {
      // ── WebCodecs path: H.264 video + Opus audio via webm-muxer ─────────────
      const hasAudio = !!(audioStream?.getAudioTracks().length)

      const muxer = new Muxer({
        target: new StreamTarget({
          onHeader: sendChunk,
          onCluster: sendChunk,
        }),
        video: { codec: 'V_MPEG4/ISO/AVC', width: outW, height: outH, frameRate: fps },
        ...(hasAudio ? { audio: { codec: 'A_OPUS', sampleRate: 48000, numberOfChannels: 2 } } : {}),
        streaming: true,
        firstTimestampBehavior: 'offset',
      })
      muxerRef.current = muxer

      // Video encoder
      const keyFrameInterval = fps * 2
      let frameCount = 0

      const videoEncoder = new VideoEncoder({
        output: (chunk, meta) => { if (activeRef.current) muxer.addVideoChunk(chunk, meta ?? undefined) },
        error: (e) => console.error('VideoEncoder:', e),
      })
      videoEncoder.configure({
        codec: h264Codec,
        width: outW,
        height: outH,
        bitrate: bitrate * 1_000_000,
        framerate: fps,
        latencyMode: 'realtime',
        hardwareAcceleration: 'prefer-hardware',
      })
      videoEncoderRef.current = videoEncoder

      // Audio encoder via AudioWorklet (modern replacement for ScriptProcessorNode)
      if (hasAudio && audioStream) {
        const audioCtx = new AudioContext({ sampleRate: 48000 })
        audioCtxRef.current = audioCtx

        const audioEncoder = new AudioEncoder({
          output: (chunk, meta) => { if (activeRef.current) muxer.addAudioChunk(chunk, meta ?? undefined) },
          error: (e) => console.error('AudioEncoder:', e),
        })
        audioEncoder.configure({ codec: 'opus', sampleRate: 48000, numberOfChannels: 2, bitrate: 128_000 })
        audioEncoderRef.current = audioEncoder

        // Inline worklet — copies PCM frames and posts them to the main thread
        const workletSrc = `
          class PCMProcessor extends AudioWorkletProcessor {
            process(inputs) {
              const ch = inputs[0]
              if (ch.length > 0) {
                const left = ch[0].slice()
                const right = (ch[1] ?? ch[0]).slice()
                this.port.postMessage({ left, right }, [left.buffer, right.buffer])
              }
              return true
            }
          }
          registerProcessor('pcm-processor', PCMProcessor)
        `
        const workletUrl = URL.createObjectURL(new Blob([workletSrc], { type: 'application/javascript' }))
        await audioCtx.audioWorklet.addModule(workletUrl)
        URL.revokeObjectURL(workletUrl)

        const source = audioCtx.createMediaStreamSource(audioStream)
        const workletNode = new AudioWorkletNode(audioCtx, 'pcm-processor')
        workletNodeRef.current = workletNode

        let audioTimestamp = 0
        workletNode.port.onmessage = (e) => {
          if (!activeRef.current || audioEncoder.state !== 'configured') return
          const { left, right } = e.data as { left: Float32Array, right: Float32Array }
          const planar = new Float32Array(left.length * 2)
          planar.set(left, 0)
          planar.set(right, left.length)
          const audioData = new AudioData({
            format: 'f32-planar',
            sampleRate: 48000,
            numberOfFrames: left.length,
            numberOfChannels: 2,
            timestamp: audioTimestamp,
            data: planar,
          })
          audioEncoder.encode(audioData)
          audioData.close()
          audioTimestamp += (left.length / 48000) * 1_000_000
        }

        source.connect(workletNode)
        workletNode.connect(audioCtx.destination)
      }

      // RAF loop — capped to stream FPS to avoid wasting CPU on the monitor refresh rate
      const frameDuration = 1000 / fps
      let lastFrameTime = 0
      const draw = (now: number) => {
        if (now - lastFrameTime >= frameDuration) {
          lastFrameTime = now
          drawScene(ctx, sceneRef.current, outW, outH, scaleX, scaleY, imgCache, scrollOffsets, bgImgRef, bgImgSrcRef)
          if (alertRef?.current) drawAlert(ctx, alertRef.current, outW, outH)

          if (videoEncoder.state === 'configured') {
            const isKeyFrame = frameCount++ % keyFrameInterval === 0
            const frame = new VideoFrame(canvas, { timestamp: now * 1000 })
            videoEncoder.encode(frame, { keyFrame: isKeyFrame })
            frame.close()
          }
        }
        rafRef.current = requestAnimationFrame(draw)
      }
      requestAnimationFrame(draw)

    } else {
      // ── VP8 fallback: MediaRecorder → ffmpeg re-encodes ──────────────────────
      const canvasStream = canvas.captureStream(fps)
      if (audioStream) audioStream.getAudioTracks().forEach(t => canvasStream.addTrack(t))

      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')
        ? 'video/webm;codecs=vp8,opus'
        : 'video/webm'

      const recorder = new MediaRecorder(canvasStream, {
        mimeType,
        videoBitsPerSecond: bitrate * 1_000_000,
        audioBitsPerSecond: 128_000,
      })
      recorder.ondataavailable = async (e) => {
        if (!activeRef.current || e.data.size === 0) return
        sendChunk(new Uint8Array(await e.data.arrayBuffer()))
      }
      recorder.start(250)
      recorderRef.current = recorder

      const frameDuration2 = 1000 / fps
      let lastFrameTime2 = 0
      const draw = (now: number) => {
        if (now - lastFrameTime2 >= frameDuration2) {
          lastFrameTime2 = now
          drawScene(ctx, sceneRef.current, outW, outH, scaleX, scaleY, imgCache, scrollOffsets, bgImgRef, bgImgSrcRef)
          if (alertRef?.current) drawAlert(ctx, alertRef.current, outW, outH)
        }
        rafRef.current = requestAnimationFrame(draw)
      }
      requestAnimationFrame(draw)
    }
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

    // Close the binary IPC WebSocket — tells Rust's WS thread to exit
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }

    // VP8 fallback cleanup
    const recorder = recorderRef.current
    recorderRef.current = null
    if (recorder && recorder.state !== 'inactive') {
      await new Promise<void>(resolve => { recorder.onstop = () => resolve(); recorder.stop() })
    }

    // WebCodecs cleanup — disconnect worklet to stop new audio frames, then flush encoders
    if (workletNodeRef.current) {
      workletNodeRef.current.disconnect()
      workletNodeRef.current = null
    }
    if (videoEncoderRef.current?.state === 'configured') {
      await videoEncoderRef.current.flush()
      videoEncoderRef.current.close()
      videoEncoderRef.current = null
    }
    if (audioEncoderRef.current?.state === 'configured') {
      await audioEncoderRef.current.flush()
      audioEncoderRef.current.close()
      audioEncoderRef.current = null
    }
    if (audioCtxRef.current) {
      await audioCtxRef.current.close()
      audioCtxRef.current = null
    }
    muxerRef.current?.finalize()
    muxerRef.current = null

    await invoke('stop_stream').catch(console.error)
  }, [])

  return { start, stop, updateScene }
}
