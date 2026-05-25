import { useEffect, useRef } from 'react'
import { audioRegistry } from '../lib/audioRegistry'

interface MusicTileProps {
  sourceId: string
  audioFileSrc?: string
  volume?: number
  loop?: boolean
  playing: boolean  // true when scene is active (always, not just when recording)
}

/**
 * Invisible audio player for background music sources.
 * Routes audio through the Web Audio API so it's captured in the stream/recording mix.
 * Plays locally through speakers AND goes to audioRegistry for buildAudioStream().
 */
export default function MusicTile({ sourceId, audioFileSrc, volume = 1, loop = true, playing }: MusicTileProps) {
  const audioRef   = useRef<HTMLAudioElement | null>(null)
  const ctxRef     = useRef<AudioContext | null>(null)
  const sourceNode = useRef<MediaElementAudioSourceNode | null>(null)
  const gainNode   = useRef<GainNode | null>(null)

  // Set up Web Audio routing once when audioFileSrc is available
  useEffect(() => {
    if (!audioFileSrc) return

    // Tear down previous context if src changed
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
    sourceNode.current = src

    const gain = ctx.createGain()
    gain.gain.value = volume
    gainNode.current = gain

    const dest = ctx.createMediaStreamDestination()

    // local playback + stream capture
    src.connect(gain)
    gain.connect(ctx.destination) // speakers
    gain.connect(dest)            // stream capture

    audioRegistry.register(sourceId, dest.stream)

    return () => {
      audio.pause()
      audio.src = ''
      ctx.close().catch(() => {})
      audioRegistry.unregister(sourceId)
    }
  }, [audioFileSrc, sourceId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Play / pause when scene switches
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

  // Volume changes
  useEffect(() => {
    if (gainNode.current) gainNode.current.gain.value = volume
    if (audioRef.current) audioRef.current.volume = 1 // gain node handles volume
  }, [volume])

  // Loop changes
  useEffect(() => {
    if (audioRef.current) audioRef.current.loop = loop
  }, [loop])

  return null // no visual element
}
