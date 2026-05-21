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

export interface Loadout {
  id: string
  name: string
  scenes: Scene[]
  createdAt: string
}

export interface SlateProject {
  version: '1.3'
  scenes: Scene[]
  activeSceneId: string
  settings: RecordingSettings
  loadouts: Loadout[]
}

export const defaultProject: SlateProject = {
  version: '1.3',
  loadouts: [],
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
      name: 'Starting Soon',
      background: { type: 'color', color: '#0d0d13' },
      sources: [
        { id: 'src-5', type: 'text', name: 'Starting label', visible: true, x: 0, y: 130, width: 640, height: 60,
          text: 'Stream Starting Soon!', scrolling: false, anchor: 'free' },
        { id: 'src-6', type: 'text', name: 'Social scroll', visible: true, x: 0, y: 320, width: 640, height: 36,
          text: '  Follow on Twitch  •  Subscribe to support  •  See you soon!  •',
          scrolling: true, anchor: 'bottom' },
      ],
    },
    {
      id: 'scene-5',
      name: 'Sub Goal',
      background: { type: 'color', color: '#0d0d13' },
      sources: [
        { id: 'src-7', type: 'screen', name: 'Game', visible: true, x: 0, y: 0, width: 640, height: 320 },
        { id: 'src-8', type: 'avatar', name: 'Cam', visible: true, x: 490, y: 220, width: 140, height: 140 },
        { id: 'src-9', type: 'text', name: 'Sub goal', visible: true, x: 0, y: 318, width: 640, height: 42,
          text: '  ⭐ Sub Goal: 0 / 50  —  Help us reach the goal!  ⭐', scrolling: true, anchor: 'bottom' },
      ],
    },
    {
      id: 'scene-6',
      name: 'New Sub!',
      background: { type: 'color', color: '#0d0d13' },
      sources: [
        { id: 'src-10', type: 'text', name: 'Hype banner', visible: true, x: 0, y: 100, width: 640, height: 70,
          text: '  🎉 NEW SUBSCRIBER!  🎉  THANK YOU!  🎉  NEW SUBSCRIBER!  🎉', scrolling: true, anchor: 'free' },
        { id: 'src-11', type: 'camera', name: 'Reaction cam', visible: true, x: 160, y: 185, width: 320, height: 180 },
        { id: 'src-12', type: 'text', name: 'Thank you', visible: true, x: 0, y: 330, width: 640, height: 36,
          text: 'Welcome to the squad! You\'re now part of the community!', scrolling: false, anchor: 'bottom' },
      ],
    },
    {
      id: 'scene-7',
      name: 'Raid!',
      background: { type: 'color', color: '#0d0d13' },
      sources: [
        { id: 'src-13', type: 'text', name: 'Raid banner', visible: true, x: 0, y: 100, width: 640, height: 70,
          text: '  ⚔️  RAID INCOMING!  ⚔️  WELCOME RAIDERS!  ⚔️  RAID INCOMING!  ⚔️', scrolling: true, anchor: 'free' },
        { id: 'src-14', type: 'camera', name: 'Cam', visible: true, x: 200, y: 185, width: 240, height: 135 },
        { id: 'src-15', type: 'text', name: 'Welcome', visible: true, x: 0, y: 330, width: 640, height: 36,
          text: 'Welcome to the stream! Drop a follow so you never miss a stream!', scrolling: false, anchor: 'bottom' },
      ],
    },
    {
      id: 'scene-8',
      name: 'End Screen',
      background: { type: 'color', color: '#0d0d13' },
      sources: [
        { id: 'src-16', type: 'text', name: 'Thanks', visible: true, x: 0, y: 120, width: 640, height: 70,
          text: 'Thanks for watching!', scrolling: false, anchor: 'free' },
        { id: 'src-17', type: 'text', name: 'CTA scroll', visible: true, x: 0, y: 310, width: 640, height: 36,
          text: '  👋 Thanks for watching!  •  Drop a follow!  •  Subscribe to support!  •  See you next time!  •',
          scrolling: true, anchor: 'bottom' },
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
    if (!parsed || !Array.isArray(parsed.scenes) || parsed.scenes.length === 0) {
      return defaultProject
    }
    const activeExists = parsed.scenes.some(s => s.id === parsed.activeSceneId)
    if (!activeExists) parsed.activeSceneId = parsed.scenes[0].id
    if (!parsed.settings) parsed.settings = defaultSettings
    if (!parsed.loadouts) parsed.loadouts = []
    return { ...parsed, version: '1.3' }
  } catch {
    return defaultProject
  }
}
