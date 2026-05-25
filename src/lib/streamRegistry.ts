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

// ── Screen capture registry ──────────────────────────────────────────────────
// Caches screen/display capture streams by sourceId so they persist across
// scene switches. When the user stops sharing (track 'ended') the cache
// entry is automatically removed. Call screenRegistry.set() when capture
// starts, screenRegistry.release() when the source is permanently removed,
// and screenRegistry.get() on mount to reuse an existing stream.
const screenCache = new Map<string, MediaStream>()

export const screenRegistry = {
  /** Store a newly captured stream. */
  set(sourceId: string, stream: MediaStream): void {
    // Watch for the user clicking "Stop sharing" in the browser bar
    stream.getVideoTracks()[0]?.addEventListener('ended', () => {
      screenCache.delete(sourceId)
    })
    screenCache.set(sourceId, stream)
  },

  /** Returns the cached stream if still active, or null. */
  get(sourceId: string): MediaStream | null {
    const stream = screenCache.get(sourceId)
    if (!stream) return null
    // If all video tracks have ended, treat as gone
    if (stream.getVideoTracks().every(t => t.readyState === 'ended')) {
      screenCache.delete(sourceId)
      return null
    }
    return stream
  },

  /** Permanently remove and stop a cached stream (source deleted from scene). */
  release(sourceId: string): void {
    const stream = screenCache.get(sourceId)
    if (stream) {
      stream.getTracks().forEach(t => t.stop())
      screenCache.delete(sourceId)
    }
  },
}
