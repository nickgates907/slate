// Stores audio streams from screen captures so the recorder can mix them with mic audio.
const registry = new Map<string, MediaStream>()

export const audioRegistry = {
  register(id: string, stream: MediaStream): void { registry.set(id, stream) },
  unregister(id: string): void { registry.delete(id) },
  getAll(): MediaStream[] { return Array.from(registry.values()) },
}
