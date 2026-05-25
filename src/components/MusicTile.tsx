import { useEffect, useRef } from 'react'
import { audioRegistry } from '../lib/audioRegistry'

interface MusicTileProps {
  sourceId: string
  audioFileSrc?: string
  volume?: number
  loop?: boolean
  monitor?: boolean  // true = also play through speakers (default true)
  playing: boolean
}

/**
 * Invisible audio player for background music sources.
 *
 * Routing:
 *   src → gain (volume) ─┬─→ dest (MediaStreamDestination) → audioRegistry → stream
 *                        └─→ monitorGain (0 or 1) → ctx.destination (speakers)
 *
 * When monitor=false the monitorGain is set to 0 so you only hear it on stream,
 * not through your own speakers. Stream capture is always active.
 */
export default function MusicTile({
  sourceId, audioFileSrc, volume = 1, loop = true, monitor = true, playing,
}: MusicTileProps) {
  const audioRef       = useRef<HTMLAudioElement | null>(null)
  const ctxRef         = useRef<AudioContext | null>(null)
  const gainNode       = useRef<GainNode | null>(null)
  const monitorGain    = useRef<GainNode | null>(null)

  // Set up Web Audio routing when src changes
  useEffect(() => {
    if (!audioFileSrc) return

    const prev = audioRef.current
    if (prev) { prev.pause(); prev.src = '' }
    ctxRef.current?.close().catch(() => {})
    audioRegistry.unregister(sourceId)

    const audio = new Audio(audioFileSrc)
    audio.loop = loop
    audio.crossOrigin = 'anonymous'
    audioRef.current = audio

    const ctx = new AudioContext()
    ctxRef.current = ctx

    const src = ctx.createMediaElementSource(audio)

    // Volume control
    const gain = ctx.createGain()
    gain.gain.value = volume
    gainNode.current = gain

    // Speaker gate — 1 = monitor on, 0 = stream only
    const mGain = ctx.createGain()
    mGain.gain.value = monitor ? 1 : 0
    monitorGain.current = mGain

    // Stream capture destination
    const dest = ctx.createMediaStreamDestination()

    src.connect(gain)
    gain.connect(dest)          // always goes to stream
    gain.connect(mGain)         // gated speaker path
    mGain.connect(ctx.destination)

    audioRegistry.register(sourceId, dest.stream)

    return () => {
      audio.pause()
      audio.src = ''
      ctx.close().catch(() => {})
      audioRegistry.unregister(sourceId)
    }
  }, [audioFileSrc, sourceId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Play / pause
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !audioFileSrc) return
    if (playing) {
      const ctx = ctxRef.current
      if (ctx?.state === 'suspended') ctx.resume().catch(() => {})
      audio.play().catch(() => {})
    } else {
      audio.pause()
      audio.currentTime = 0
    }
  }, [playing, audioFileSrc])

  // Volume
  useEffect(() => {
    if (gainNode.current) gainNode.current.gain.value = volume
  }, [volume])

  // Monitor toggle — smoothly ramp to avoid clicks
  useEffect(() => {
    const mg = monitorGain.current
    if (!mg) return
    const ctx = ctxRef.current
    if (ctx) {
      mg.gain.setTargetAtTime(monitor ? 1 : 0, ctx.currentTime, 0.015)
    } else {
      mg.gain.value = monitor ? 1 : 0
    }
  }, [monitor])

  // Loop
  useEffect(() => {
    if (audioRef.current) audioRef.current.loop = loop
  }, [loop])

  return null
}
