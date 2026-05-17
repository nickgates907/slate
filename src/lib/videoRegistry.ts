// Shared registry so the recorder compositor can draw every live video/canvas element.
// Accepts HTMLVideoElement (raw feed) or HTMLCanvasElement (processed, e.g. BG removal).
type DrawableSource = HTMLVideoElement | HTMLCanvasElement

const registry = new Map<string, DrawableSource>()

export const videoRegistry = {
  register(id: string, el: DrawableSource): void {
    registry.set(id, el)
  },
  unregister(id: string): void {
    registry.delete(id)
  },
  get(id: string): DrawableSource | undefined {
    return registry.get(id)
  },
  getAll(): ReadonlyMap<string, DrawableSource> {
    return registry
  },
}
