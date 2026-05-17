import { save, open } from '@tauri-apps/api/dialog'
import { writeTextFile, readTextFile } from '@tauri-apps/api/fs'
import { Scene, Source } from '../store'

interface SlateLayout {
  version: 1
  name: string
  sources: Source[]
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
