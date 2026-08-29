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

// Public anon key — safe to embed client-side, access is scoped by RLS policies
// on the loadout_codes table (anyone may insert or select by exact code, nothing else).
// Talks to Supabase's REST endpoint directly via fetch (same pattern as crashReporter.ts)
// rather than the @supabase/supabase-js SDK — that SDK's auth/realtime/storage clients
// added ~170KB gzipped to the app's startup bundle for two simple REST calls.
const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string) ?? ''
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) ?? ''
const SUPABASE_HEADERS = {
  'Content-Type': 'application/json',
  'apikey': SUPABASE_ANON_KEY,
  'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
}

// Avoids visually ambiguous characters (0/O, 1/I/L)
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const SHORT_CODE_RE = /^SLATE2-([A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4})$/i

function randomGroup(len: number): string {
  let out = ''
  for (let i = 0; i < len; i++) out += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]
  return out
}

function randomCode(): string {
  return `${randomGroup(4)}-${randomGroup(4)}-${randomGroup(4)}`
}

// Resizes and re-encodes an embedded image data: URL so it's small enough to fit in a
// shared loadout code. Background/overlay images are often several MB straight out of
// a screenshot tool, so downscaling to 1600px on the long edge (comfortably above 1080p,
// the default recording resolution) and re-encoding as JPEG at 88% quality keeps the
// image visually indistinguishable from the original in normal use, while still cutting
// a multi-MB source image down to a few hundred KB.
async function compressImageDataUrl(dataUrl: string, maxDim = 1600, quality = 0.88): Promise<string> {
  const img = new Image()
  const loaded = new Promise<void>((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = () => reject(new Error('Failed to decode image'))
  })
  img.src = dataUrl
  await loaded

  const scale = Math.min(1, maxDim / Math.max(img.width, img.height))
  const width = Math.max(1, Math.round(img.width * scale))
  const height = Math.max(1, Math.round(img.height * scale))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return dataUrl // no canvas support -- fall back to the original rather than fail
  ctx.drawImage(img, 0, 0, width, height)
  return canvas.toDataURL('image/jpeg', quality)
}

async function stripLocalFields(scenes: Scene[]): Promise<Scene[]> {
  return Promise.all(scenes.map(async scene => ({
    ...scene,
    background: scene.background?.imageSrc
      ? { ...scene.background, imageSrc: await compressImageDataUrl(scene.background.imageSrc).catch(() => scene.background!.imageSrc) }
      : scene.background,
    sources: await Promise.all(scene.sources.map(async s => ({
      ...s,
      deviceId: undefined,     // machine-specific, won't match on another PC
      audioFileSrc: undefined, // audio files as base64 are too large to share
      imageSrc: s.imageSrc ? await compressImageDataUrl(s.imageSrc).catch(() => s.imageSrc) : undefined,
      htmlPath: undefined,     // machine-specific file path
    }))),
  })))
}

// Creates a short, readable share code (e.g. SLATE2-K9XF-27PQ-MV4T). The loadout
// itself lives in Supabase; the code is just a lookup key. Requires internet to
// create and to import — for a fully offline, permanent alternative use "Export
// layout" instead, which saves a standalone .slate file with no server involved.
export async function createShareCode(name: string, scenes: Scene[]): Promise<string> {
  const cleanScenes = await stripLocalFields(scenes)
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = randomCode()
    const res = await fetch(`${SUPABASE_URL}/rest/v1/loadout_codes`, {
      method: 'POST',
      headers: { ...SUPABASE_HEADERS, 'Prefer': 'return=minimal' },
      body: JSON.stringify({ code, name, scenes: cleanScenes }),
    })
    if (res.ok) return `SLATE2-${code}`
    const body = await res.json().catch(() => null)
    if (body?.code === '23505') continue // extremely unlikely code collision, retry with a fresh random code
    if (body?.message?.includes('scenes_size_limit')) {
      throw new Error('This loadout is too large to share as a code — try removing extra scenes, or use "Export layout" instead, which saves a local file with no size limit.')
    }
    throw new Error(body?.message || `Request failed (${res.status})`) // not a collision — a real failure
    // else: extremely unlikely code collision, retry with a fresh random code
  }
  throw new Error('Could not generate a unique share code — please try again.')
}

async function resolveShareCode(code: string): Promise<{ name: string; scenes: Scene[] } | null> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/loadout_codes?code=eq.${encodeURIComponent(code.toUpperCase())}&select=name,scenes`,
    { headers: SUPABASE_HEADERS },
  )
  if (!res.ok) return null
  const rows = await res.json().catch(() => null)
  if (!Array.isArray(rows) || rows.length === 0) return null
  return { name: rows[0].name, scenes: rows[0].scenes }
}

// Gzip the JSON before base64 — kept only to decode older self-contained codes
// generated before the short-code system existed. @types/node's global ReadableStream
// (pulled in transitively) shadows the DOM lib's version and its generics don't line
// up cleanly with CompressionStream's declared types either — both are known TS/DOM-lib
// friction points for this API, not a real runtime issue, so we go through `any`.
async function gunzipFromBase64(b64: string): Promise<string> {
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  const raw: any = new Blob([bytes]).stream()
  const stream = raw.pipeThrough(new DecompressionStream('gzip'))
  return new TextDecoder().decode(await new Response(stream).arrayBuffer())
}

export async function decodeLoadout(code: string): Promise<{ name: string; scenes: Scene[] } | null> {
  const trimmed = code.trim()

  // Current format — short server-backed code
  const shortMatch = trimmed.match(SHORT_CODE_RE)
  if (shortMatch) return resolveShareCode(shortMatch[1])

  try {
    // Older self-contained formats, kept so previously shared codes keep working
    if (trimmed.startsWith('SLATE3-')) {
      const json = await gunzipFromBase64(trimmed.slice('SLATE3-'.length))
      const payload: SlateLoadoutCode = JSON.parse(json)
      if (payload.version !== 2 || !payload.name || !Array.isArray(payload.scenes)) return null
      return { name: payload.name, scenes: payload.scenes }
    }
    if (trimmed.startsWith('SLATE2-')) {
      const payload: SlateLoadoutCode = JSON.parse(decodeURIComponent(escape(atob(trimmed.slice('SLATE2-'.length)))))
      if (payload.version !== 2 || !payload.name || !Array.isArray(payload.scenes)) return null
      return { name: payload.name, scenes: payload.scenes }
    }
    return null
  } catch {
    return null
  }
}

export async function exportLayout(scene: Scene): Promise<void> {
  const layout: SlateLayout = {
    version: 1,
    name: scene.name,
    // Strip device IDs — they're machine-specific and won't match on another PC
    sources: scene.sources.map(s => ({ ...s, deviceId: undefined, htmlPath: undefined })),
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
