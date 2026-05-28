import { save, open } from '@tauri-apps/api/dialog'
import { writeTextFile, readTextFile } from '@tauri-apps/api/fs'
import { Scene, Source } from '../store'

interface SlateLayout {
  version: 1
  name: string
  sources: Source[]
}

interface SlateLoadoutCode {
  version: 2
  name: string
  scenes: Scene[]
  exportedAt: string
}

export function encodeLoadout(name: string, scenes: Scene[]): string {
  const payload: SlateLoadoutCode = {
    version: 2,
    name,
    scenes: scenes.map(scene => ({
      ...scene,
      sources: scene.sources.map(s => ({
        ...s,
        deviceId: undefined,     // machine-specific, won't match on another PC
        audioFileSrc: undefined, // audio files as base64 are too large for a paste code
      })),
    })),
    exportedAt: new Date().toISOString(),
  }
  return 'SLATE2-' + btoa(unescape(encodeURIComponent(JSON.stringify(payload))))
}

export function decodeLoadout(code: string): { name: string; scenes: Scene[] } | null {
  try {
    const b64 = code.trim().replace(/^SLATE2-/, '')
    const payload: SlateLoadoutCode = JSON.parse(decodeURIComponent(escape(atob(b64))))
    if (payload.version !== 2 || !payload.name || !Array.isArray(payload.scenes)) return null
    return { name: payload.name, scenes: payload.scenes }
  } catch {
    return null
  }
}

export async function exportLayout(scene: Scene): Promise<void> {
  const layout: SlateLayout = {
    version: 1,
    name: scene.name,
    // Strip device IDs — they're machine-specific and won't match on another PC
    sources: scene.sources.map(s => ({ ...s, deviceId: undefined })),
  }

  const path = await save({
    title: 'Export layout',
    defaultPath: `${scene.name}.slate`,
    filters: [{ name: 'Slate Layout', extensions: ['slate'] }],
  })
  if (!path) return
  await writeTextFile(path, JSON.stringify(layout, null, 2))
}

export async function importLayout(): Promise<Omit<Scene, 'id'> | null> {
  const result = await open({
    title: 'Import layout',
    filters: [{ name: 'Slate Layout', extensions: ['slate'] }],
    multiple: false,
  })
  if (!result || Array.isArray(result)) return null
  const text = await readTextFile(result)
  const layout: SlateLayout = JSON.parse(text)
  if (layout.version !== 1 || !layout.name || !Array.isArray(layout.sources)) return null
  return { name: layout.name, sources: layout.sources }
}
