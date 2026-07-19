const frames = new Map<string, ImageBitmap>()

export const browserFrameRegistry = {
  set(id: string, bitmap: ImageBitmap) {
    const old = frames.get(id)
    if (old) old.close()
    frames.set(id, bitmap)
  },
  get(id: string): ImageBitmap | undefined {
    return frames.get(id)
  },
  delete(id: string) {
    const old = frames.get(id)
    if (old) old.close()
    frames.delete(id)
  },
}
