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
