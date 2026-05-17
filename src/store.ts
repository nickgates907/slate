import { writeTextFile, readTextFile, createDir } from '@tauri-apps/api/fs'
import { appDataDir, join } from '@tauri-apps/api/path'

export interface Source {
  id: string
  type: 'camera' | 'screen' | 'avatar' | 'image' | 'audio' | 'text'
  name: string
  visible: boolean
  x: number
  y: number
  width: number
  height: number
  deviceId?: string
  text?: string
  scrolling?: boolean
  anchor?: 'free' | 'bottom'
  fontSize?: number  // px, default 16
  color?: string     // hex, default '#ffffff'
  imageSrc?: string  // image source: data URL of the loaded image
  volume?: number    // 0–1, applies to audio sources (default 1)
  bgRemoval?: boolean  // strip background from camera/avatar via ML segmentation
}

export interface SceneBackground {
  type: 'color' | 'image'
  color: string       // hex, default '#000000'
  imageSrc?: string   // data URL
}

export const defaultBackground: SceneBackground = { type: 'color', color: '#000000' }

export interface Scene {
  id: string
  name: string
  sources: Source[]
  background?: SceneBackground
}

export interface RecordingSettings {
  resolution: '720p' | '1080p' | '1440p'
  fps: 30 | 60
  bitrate: 4 | 8 | 16  // Mbps
  saveFolder: string   // empty string = default Documents/Slate Recordings
  showTooltips: boolean
}

export const defaultSettings: RecordingSettings = {
  resolution: '1080p',
  fps: 30,
  bitrate: 8,
  saveFolder: '',
  showTooltips: true,
}

export interface SlateProject {
  version: '1.2'
  scenes: Scene[]
  activeSceneId: string
  settings: RecordingSettings
}

export const defaultProject: SlateProject = {
  version: '1.2',
  settings: defaultSettings,
  activeSceneId: 'scene-1',
  scenes: [
    {
      id: 'scene-1',
      name: 'Game capture',
      sources: [
        { id: 'src-2', type: 'screen', name: 'Game window', visible: true, x: 0, y: 0, width: 640, height: 360 },
        { id: 'src-1', type: 'camera', name: 'Webcam', visible: true, x: 460, y: 200, width: 180, height: 100 },
      ],
    },
    {
      id: 'scene-2',
      name: 'Just chatting',
      sources: [
        { id: 'src-3', type: 'avatar', name: 'Avatar cam', visible: true, x: 220, y: 80, width: 200, height: 200 },
      ],
    },
    {
      id: 'scene-3',
      name: 'Screen share',
      sources: [
        { id: 'src-4', type: 'screen', name: 'Desktop', visible: true, x: 0, y: 0, width: 640, height: 360 },
      ],
    },
    {
      id: 'scene-4',
      name: 'Intro / outro',
      sources: [
        { id: 'src-5', type: 'image', name: 'Intro screen', visible: true, x: 0, y: 0, width: 640, height: 360 },
      ],
    },
  ],
}

let _projectPath: string | null = null

async function getProjectPath(): Promise<string> {
  if (_projectPath) return _projectPath
  const dir = await appDataDir()
  await createDir(dir, { recursive: true })
  _projectPath = await join(dir, 'project.json')
  return _projectPath
}

export async function saveProject(project: SlateProject): Promise<void> {
  const path = await getProjectPath()
  await writeTextFile(path, JSON.stringify(project))
}

export async function loadProject(): Promise<SlateProject> {
  try {
    const path = await getProjectPath()
    const text = await readTextFile(path)
    const parsed = JSON.parse(text) as SlateProject
    if (!parsed || parsed.version !== '1.2' || !Array.isArray(parsed.scenes) || parsed.scenes.length === 0) {
      return defaultProject
    }
    const activeExists = parsed.scenes.some(s => s.id === parsed.activeSceneId)
    if (!activeExists) parsed.activeSceneId = parsed.scenes[0].id
    if (!parsed.settings) parsed.settings = defaultSettings
    return parsed
  } catch {
    return defaultProject
  }
}
