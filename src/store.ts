import { writeTextFile, readTextFile, writeBinaryFile, removeFile, createDir } from '@tauri-apps/api/fs'
import { appDataDir, join } from '@tauri-apps/api/path'
import { convertFileSrc } from '@tauri-apps/api/tauri'

export interface Source {
  id: string
  type: 'camera' | 'screen' | 'avatar' | 'image' | 'audio' | 'text' | 'music' | 'browser'
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
  audioFileSrc?: string  // data URL of an audio file (music sources)
  loop?: boolean     // loop music (default true)
  monitor?: boolean  // play music through local speakers too (default true)
  bgRemoval?: boolean  // strip background from camera/avatar via ML segmentation
  htmlPath?: string   // absolute path to an HTML file (browser sources)
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
  bitrate: 4 | 6 | 8 | 16  // Mbps
  saveFolder: string   // empty string = default Documents/Slate Recordings
  showTooltips: boolean
  preferredCameraId?: string  // app-wide camera choice, applied to every scene's camera/avatar sources
}

export const defaultSettings: RecordingSettings = {
  resolution: '1080p',
  fps: 30,
  bitrate: 6,
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
        { id: 'src-mic-1', type: 'audio', name: 'Microphone', visible: true, x: 0, y: 0, width: 0, height: 0, volume: 1 },
        { id: 'src-2', type: 'screen', name: 'Game window', visible: true, x: 0, y: 0, width: 640, height: 360 },
        { id: 'src-1', type: 'camera', name: 'Webcam', visible: true, x: 460, y: 200, width: 180, height: 100 },
      ],
    },
    {
      id: 'scene-2',
      name: 'Just chatting',
      sources: [
        { id: 'src-mic-2', type: 'audio', name: 'Microphone', visible: true, x: 0, y: 0, width: 0, height: 0, volume: 1 },
        { id: 'src-3', type: 'avatar', name: 'Avatar cam', visible: true, x: 220, y: 80, width: 200, height: 200 },
      ],
    },
    {
      id: 'scene-3',
      name: 'Screen share',
      sources: [
        { id: 'src-mic-3', type: 'audio', name: 'Microphone', visible: true, x: 0, y: 0, width: 0, height: 0, volume: 1 },
        { id: 'src-4', type: 'screen', name: 'Desktop', visible: true, x: 0, y: 0, width: 640, height: 360 },
      ],
    },
    {
      id: 'scene-4',
      name: 'Starting Soon',
      background: { type: 'color', color: '#0d0d13' },
      sources: [
        { id: 'src-mic-4', type: 'audio', name: 'Microphone', visible: true, x: 0, y: 0, width: 0, height: 0, volume: 1 },
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
        { id: 'src-mic-5', type: 'audio', name: 'Microphone', visible: true, x: 0, y: 0, width: 0, height: 0, volume: 1 },
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
        { id: 'src-mic-6', type: 'audio', name: 'Microphone', visible: true, x: 0, y: 0, width: 0, height: 0, volume: 1 },
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
        { id: 'src-mic-7', type: 'audio', name: 'Microphone', visible: true, x: 0, y: 0, width: 0, height: 0, volume: 1 },
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
        { id: 'src-mic-8', type: 'audio', name: 'Microphone', visible: true, x: 0, y: 0, width: 0, height: 0, volume: 1 },
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
let _termsPath: string | null = null
let _settingsPath: string | null = null

async function getProjectPath(): Promise<string> {
  if (_projectPath) return _projectPath
  const dir = await appDataDir()
  await createDir(dir, { recursive: true })
  _projectPath = await join(dir, 'project.json')
  return _projectPath
}

let _mediaDir: string | null = null

async function getMediaDir(): Promise<string> {
  if (_mediaDir) return _mediaDir
  const dir = await appDataDir()
  const mediaDir = await join(dir, 'media')
  await createDir(mediaDir, { recursive: true })
  _mediaDir = mediaDir
  return _mediaDir
}

// Music files are large (often several MB) -- embedding them as base64 directly in
// project.json meant every autosave (even a Loop/Monitor checkbox flip) had to
// re-serialize and rewrite the whole blob through Tauri's IPC bridge, causing a real
// UI stutter. Storing them as their own file keeps project.json tiny regardless of
// how many/large music files are attached. Returns the raw file path -- callers
// convert it to a playable URL via mediaSrcToUrl() at the point of use, since storing
// the raw path (rather than a pre-converted asset:// URL) makes later cleanup trivial
// and isn't tied to Tauri's URL format for the asset protocol.
export async function saveMediaFile(bytes: Uint8Array, extension: string): Promise<string> {
  const dir = await getMediaDir()
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`
  const path = await join(dir, filename)
  await writeBinaryFile(path, bytes)
  return path
}

// Best-effort cleanup when a source's media is replaced or removed. Silently no-ops
// for anything that isn't a real file we wrote (e.g. legacy base64 data: URLs from
// before this existed) -- an orphaned file is harmless, never let cleanup break the UI.
export async function deleteMediaFile(path: string | undefined): Promise<void> {
  if (!path || path.startsWith('data:')) return
  await removeFile(path).catch(() => {})
}

// Source.audioFileSrc/imageSrc hold either a legacy base64 data: URL (old projects)
// or a raw file path (saveMediaFile's return value) -- resolve either into something
// an <audio>/<img> src can load directly.
export function mediaSrcToUrl(src: string | undefined): string | undefined {
  if (!src) return undefined
  return src.startsWith('data:') ? src : convertFileSrc(src)
}

async function getSettingsPath(): Promise<string> {
  if (_settingsPath) return _settingsPath
  const dir = await appDataDir()
  await createDir(dir, { recursive: true })
  _settingsPath = await join(dir, 'settings.json')
  return _settingsPath
}

async function getTermsPath(): Promise<string> {
  if (_termsPath) return _termsPath
  const dir = await appDataDir()
  await createDir(dir, { recursive: true })
  _termsPath = await join(dir, 'terms.json')
  return _termsPath
}

export async function loadTermsAccepted(): Promise<boolean> {
  try {
    const path = await getTermsPath()
    const text = await readTextFile(path)
    return JSON.parse(text).accepted === true
  } catch {
    return false
  }
}

export async function saveTermsAccepted(): Promise<void> {
  const path = await getTermsPath()
  await writeTextFile(path, JSON.stringify({ accepted: true, date: new Date().toISOString() }))
}

export async function saveProject(project: SlateProject): Promise<void> {
  const path = await getProjectPath()
  await writeTextFile(path, JSON.stringify(project))
}

// Settings live in their own small file, separate from project.json (which can hold
// embedded base64 image/audio data for scenes and gets large). Recording settings are
// changed far more often than scenes are restructured, and previously both were saved
// through the same debounced full-project write — so flipping a resolution/fps pill
// caused a resave of the entire scenes+sources blob, including any embedded media,
// which showed up as a real UI stutter right after saving settings. This keeps that
// save tiny and independent of scene/source size.
export async function saveSettings(settings: RecordingSettings): Promise<void> {
  const path = await getSettingsPath()
  await writeTextFile(path, JSON.stringify(settings))
}

export async function loadSettings(): Promise<RecordingSettings | null> {
  try {
    const path = await getSettingsPath()
    const text = await readTextFile(path)
    return JSON.parse(text) as RecordingSettings
  } catch {
    return null
  }
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
    // Dedicated settings.json takes over once it exists — project.json's copy is
    // only a fallback for projects saved before this split existed.
    const dedicatedSettings = await loadSettings()
    if (dedicatedSettings) parsed.settings = dedicatedSettings
    return { ...parsed, version: '1.3' }
  } catch {
    return defaultProject
  }
}
