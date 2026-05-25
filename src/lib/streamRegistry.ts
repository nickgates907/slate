// Caches camera MediaStreams by deviceId so they survive scene switches.
// VideoTile acquires a stream on mount and releases on unmount — if another
// tile for the same device is already running the stream is reused instantly.
const cache = new Map<string, { stream: MediaStream; refs: number }>()

function key(deviceId: string | undefined) {
  return deviceId ?? '__default__'
}

export const streamRegistry = {
  async acquire(deviceId: string | undefined): Promise<MediaStream> {
    const k = key(deviceId)
    const entry = cache.get(k)
    if (entry) {
      entry.refs++
      return entry.stream
    }
    const constraints: MediaStreamConstraints = {
      video: deviceId ? { deviceId: { exact: deviceId } } : true,
      audio: false,
    }
    const stream = await navigator.mediaDevices.getUserMedia(constraints)
    cache.set(k, { stream, refs: 1 })
    return stream
  },

  release(deviceId: string | undefined): void {
    const k = key(deviceId)
    const entry = cache.get(k)
    if (!entry) return
    entry.refs--
    if (entry.refs <= 0) {
      entry.stream.getTracks().forEach(t => t.stop())
      cache.delete(k)
    }
  },
}

// ── Global screen capture registry ──────────────────────────────────────────
// ONE stream shared across every scene. Select screen once → all screen
// sources on all scenes reuse the same capture automatically.
// Audio is registered under the fixed key '__screen__' so it stays in the
// stream mix regardless of which scene is currently active.
//
// VideoTile only needs to register/unregister VIDEO (per sourceId for the
// canvas renderer). Audio is owned here and never touched by VideoTile.

import { audioRegistry } from './audioRegistry'

let _globalStream: MediaStream | null = null

export const screenRegistry = {
  /** Called when the user picks a new display to share. */
  set(_sourceId: string, stream: MediaStream): void {
    // Stop any previous capture
    if (_globalStream) {
      _globalStream.getTracks().forEach(t => t.stop())
      audioRegistry.unregister('__screen__')
    }
    _globalStream = stream

    // Register audio once, globally — survives scene switches
    if (stream.getAudioTracks().length > 0) {
      audioRegistry.register('__screen__', stream)
    }

    // Auto-cleanup when user clicks "Stop sharing" in the browser bar
    stream.getVideoTracks()[0]?.addEventListener('ended', () => {
      if (_globalStream === stream) {
        _globalStream = null
        audioRegistry.unregister('__screen__')
      }
    })
  },

  /**
   * Returns the live global stream if one exists, regardless of sourceId.
   * Any scene's screen source can call this to instantly get the active capture.
   */
  get(_sourceId: string): MediaStream | null {
    if (!_globalStream) return null
    if (_globalStream.getVideoTracks().every(t => t.readyState === 'ended')) {
      _globalStream = null
      audioRegistry.unregister('__screen__')
      return null
    }
    return _globalStream
  },

  /** True if a live screen capture exists (use to show/hide "Select screen" UI). */
  isActive(): boolean {
    return !!screenRegistry.get('__check__')
  },

  /** Called when a screen source is permanently deleted from a scene. */
  release(_sourceId: string): void {
    if (_globalStream) {
      _globalStream.getTracks().forEach(t => t.stop())
      _globalStream = null
      audioRegistry.unregister('__screen__')
    }
  },
}
