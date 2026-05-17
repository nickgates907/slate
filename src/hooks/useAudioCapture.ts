import { useState, useRef, useEffect, useCallback } from 'react'
import type React from 'react'

export function useAudioCapture() {
  const [active, setActive] = useState(false)
  const [level, setLevel] = useState(0)
  const rawStreamRef = useRef<MediaStream | null>(null)
  const processedStreamRef = useRef<MediaStream | null>(null)
  const gainNodeRef = useRef<GainNode | null>(null)
  const rafRef = useRef<number | null>(null)
  const ctxRef = useRef<AudioContext | null>(null)

  const start = useCallback(async () => {
    if (rawStreamRef.current) return
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      rawStreamRef.current = stream

      const audioCtx = new AudioContext()
      ctxRef.current = audioCtx
      const source = audioCtx.createMediaStreamSource(stream)

      const gainNode = audioCtx.createGain()
      gainNodeRef.current = gainNode

      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 256

      const destination = audioCtx.createMediaStreamDestination()
      processedStreamRef.current = destination.stream

      source.connect(gainNode)
      gainNode.connect(analyser)
      gainNode.connect(destination)

      const data = new Uint8Array(analyser.frequencyBinCount)
      const tick = () => {
        analyser.getByteFrequencyData(data)
        const avg = data.reduce((a, b) => a + b, 0) / data.length
        setLevel(avg / 128)
        rafRef.current = requestAnimationFrame(tick)
      }
      tick()
      setActive(true)
    } catch {
      setActive(false)
    }
  }, [])

  const setGain = useCallback((value: number) => {
    if (gainNodeRef.current) gainNodeRef.current.gain.value = value
  }, [])

  const stop = useCallback(() => {
    if (rafRef.current !== null) { cancelAnimationFrame(rafRef.current); rafRef.current = null }
    rawStreamRef.current?.getTracks().forEach(t => t.stop())
    rawStreamRef.current = null
    processedStreamRef.current = null
    gainNodeRef.current = null
    ctxRef.current?.close()
    ctxRef.current = null
    setActive(false)
    setLevel(0)
  }, [])

  useEffect(() => () => stop(), [stop])

  return {
    active,
    level,
    stream: processedStreamRef as React.RefObject<MediaStream | null>,
    setGain,
    start,
    stop,
  }
}
