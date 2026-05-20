import { useState, useEffect, useCallback, useRef } from 'react'
import Titlebar from './components/Titlebar'
import Sidebar from './components/Sidebar'
import Canvas from './components/Canvas'
import SourcesPanel from './components/SourcesPanel'
import PlaybackModal from './components/PlaybackModal'
import OverlaysModal from './components/OverlaysModal'
import { Scene, Source, SceneBackground, Loadout, SlateProject, loadProject, saveProject, defaultProject, defaultSettings } from './store'
import { TooltipContext } from './contexts/TooltipContext'
import SettingsModal from './components/SettingsModal'
import StreamingModal from './components/StreamingModal'
import SplashScreen from './components/SplashScreen'
import { useRecorder, RecordingResult } from './hooks/useRecorder'
import { useStreamer } from './hooks/useStreamer'
import { useAlerts } from './hooks/useAlerts'
import { useAudioCapture } from './hooks/useAudioCapture'
import { useCameraDevices } from './hooks/useCameraDevices'
import { exportLayout, importLayout } from './lib/layoutShare'
import { OverlayTemplate } from './lib/overlayTemplates'
import { TWITCH_CLIENT_ID } from './config/platforms'

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600).toString().padStart(2, '0')
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${h}:${m}:${s}`
}

export default function App() {
  // ── State ──────────────────────────────────────────────────────────────
  const [project, setProject] = useState<SlateProject>(defaultProject)
  const [isRecording, setIsRecording] = useState(false)
  const [recordSeconds, setRecordSeconds] = useState(0)
  const [recordingResult, setRecordingResult] = useState<RecordingResult | null>(null)
  const [showOverlays, setShowOverlays] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [splash, setSplash] = useState(true)
  const [showStreaming, setShowStreaming] = useState(false)
  const [streamStatus, setStreamStatus] = useState<'idle' | 'connecting' | 'live'>('idle')
  const [liveSeconds, setLiveSeconds] = useState(0)
  const [dark, setDark] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const liveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const previewRef = useRef<HTMLDivElement>(null)

  const recorder = useRecorder()
  const streamer = useStreamer()
  const alerts = useAlerts()
  const audio = useAudioCapture()
  const cameraDevices = useCameraDevices()

  // ── Effects (all hooks must come before any conditional return) ────────

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])

  // Load project from AppData on mount
  useEffect(() => {
    loadProject().then(setProject).catch(() => setProject(defaultProject))
  }, [])

  // Auto-save to AppData whenever project changes
  useEffect(() => {
    if (project) saveProject(project).catch(console.error)
  }, [project])

  // Derived values — null-safe so hooks below can reference them
  const activeScene =
    project.scenes.find(s => s.id === project.activeSceneId) ??
    project.scenes[0]

  const micEnabled = activeScene.sources.some(s => s.type === 'audio' && s.visible)
  const micVolume = activeScene.sources.find(s => s.type === 'audio')?.volume ?? 1

  useEffect(() => {
    if (micEnabled) audio.start()
    else audio.stop()
  }, [micEnabled]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    audio.setGain(micVolume)
  }, [micVolume]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isRecording) recorder.updateScene(activeScene)
  }, [activeScene, isRecording]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (streamStatus === 'live') streamer.updateScene(activeScene)
  }, [activeScene, streamStatus]) // eslint-disable-line react-hooks/exhaustive-deps

  // Scene hotkeys: 1–9 switch to that scene index
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement).isContentEditable) return
      const idx = parseInt(e.key) - 1
      if (!isNaN(idx) && idx >= 0 && idx < project.scenes.length) {
        selectScene(project.scenes[idx].id)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [project.scenes]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => setRecordSeconds(s => s + 1), 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
      setRecordSeconds(0)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [isRecording])

  useEffect(() => {
    if (streamStatus === 'live') {
      liveTimerRef.current = setInterval(() => setLiveSeconds(s => s + 1), 1000)
    } else {
      if (liveTimerRef.current) clearInterval(liveTimerRef.current)
      setLiveSeconds(0)
    }
    return () => { if (liveTimerRef.current) clearInterval(liveTimerRef.current) }
  }, [streamStatus])

  // ── Handlers ──────────────────────────────────────────────────────────

  const toggleRecord = async () => {
    if (isRecording) {
      setIsRecording(false)
      const result = await recorder.stop()
      if (result) setRecordingResult(result)
    } else {
      if (!previewRef.current) return
      setIsRecording(true)
      recorder.start(
        activeScene,
        previewRef.current,
        project.settings?.resolution ?? '1080p',
        audio.active && audio.stream.current ? audio.stream.current : undefined,
      )
    }
  }

  const selectScene = (id: string) => setProject(p => ({ ...p, activeSceneId: id }))

  const addScene = () => {
    const id = `scene-${Date.now()}`
    const newScene: Scene = { id, name: `Scene ${project.scenes.length + 1}`, sources: [] }
    setProject(p => ({ ...p, scenes: [...p.scenes, newScene], activeSceneId: id }))
  }

  const removeScene = (sceneId: string) => {
    if (project.scenes.length <= 1) return
    const remaining = project.scenes.filter(s => s.id !== sceneId)
    const newActiveId = sceneId === project.activeSceneId ? remaining[0].id : project.activeSceneId
    setProject(p => ({ ...p, scenes: remaining, activeSceneId: newActiveId }))
  }

  const renameScene = useCallback((sceneId: string, name: string) => {
    setProject(p => ({
      ...p,
      scenes: p.scenes.map(s => s.id === sceneId ? { ...s, name } : s),
    }))
  }, [])

  const updateSource = useCallback((sourceId: string, updates: Partial<Source>) => {
    setProject(p => ({
      ...p,
      scenes: p.scenes.map(scene =>
        scene.id === p.activeSceneId
          ? { ...scene, sources: scene.sources.map(src => src.id === sourceId ? { ...src, ...updates } : src) }
          : scene
      ),
    }))
  }, [])

  const toggleSourceVisible = (sourceId: string) => {
    const source = activeScene.sources.find(s => s.id === sourceId)
    if (source) updateSource(sourceId, { visible: !source.visible })
  }

  const removeSource = useCallback((sourceId: string) => {
    setProject(p => ({
      ...p,
      scenes: p.scenes.map(scene =>
        scene.id === p.activeSceneId
          ? { ...scene, sources: scene.sources.filter(src => src.id !== sourceId) }
          : scene
      ),
    }))
  }, [])

  const reorderSource = useCallback((sourceId: string, direction: 'up' | 'down') => {
    setProject(p => ({
      ...p,
      scenes: p.scenes.map(scene => {
        if (scene.id !== p.activeSceneId) return scene
        const sources = [...scene.sources]
        const idx = sources.findIndex(s => s.id === sourceId)
        if (idx < 0) return scene
        const target = direction === 'up' ? idx - 1 : idx + 1
        if (target < 0 || target >= sources.length) return scene
        ;[sources[idx], sources[target]] = [sources[target], sources[idx]]
        return { ...scene, sources }
      }),
    }))
  }, [])

  const changeCameraDevice = useCallback((sourceId: string, deviceId: string) => {
    updateSource(sourceId, { deviceId })
  }, [updateSource])

  const changeVolume = useCallback((sourceId: string, volume: number) => {
    updateSource(sourceId, { volume })
  }, [updateSource])

  const updateBackground = useCallback((bg: SceneBackground) => {
    setProject(p => ({
      ...p,
      scenes: p.scenes.map(scene =>
        scene.id === p.activeSceneId ? { ...scene, background: bg } : scene
      ),
    }))
  }, [])

  const handleExportLayout = () => {
    exportLayout(activeScene).catch(e => console.error('Export failed', e))
  }

  const handleImportLayout = async () => {
    const layout = await importLayout().catch(e => { console.error('Import failed', e); return null })
    if (!layout) return
    const id = `scene-${Date.now()}`
    const newScene: Scene = { id, ...layout }
    setProject(p => ({ ...p, scenes: [...p.scenes, newScene], activeSceneId: id }))
  }

  const handleLoadTemplate = (template: OverlayTemplate) => {
    const id = `scene-${Date.now()}`
    const newScene: Scene = { id, ...template.build() }
    setProject(p => ({ ...p, scenes: [...p.scenes, newScene], activeSceneId: id }))
  }

  const addAssetSource = useCallback((source: Omit<Source, 'id'>) => {
    const newSource: Source = { ...source, id: `src-${Date.now()}` }
    setProject(p => ({
      ...p,
      scenes: p.scenes.map(scene =>
        scene.id === p.activeSceneId
          ? { ...scene, sources: [...scene.sources, newSource] }
          : scene
      ),
    }))
  }, [])

  const saveLoadout = useCallback((name: string) => {
    const loadout: Loadout = {
      id: `loadout-${Date.now()}`,
      name,
      scenes: project.scenes.map(s => ({ ...s })),
      createdAt: new Date().toISOString(),
    }
    setProject(p => ({ ...p, loadouts: [...(p.loadouts ?? []), loadout] }))
  }, [project.scenes])

  const loadLoadout = useCallback((loadout: Loadout) => {
    setProject(p => ({
      ...p,
      scenes: loadout.scenes.map(s => ({ ...s })),
      activeSceneId: loadout.scenes[0]?.id ?? p.activeSceneId,
    }))
  }, [])

  const deleteLoadout = useCallback((id: string) => {
    setProject(p => ({ ...p, loadouts: (p.loadouts ?? []).filter(l => l.id !== id) }))
  }, [])

  const goLive = async (rtmpUrls: string[], twitchToken?: string) => {
    if (!previewRef.current || rtmpUrls.length === 0) return
    setStreamStatus('connecting')
    try {
      await streamer.start(
        activeScene,
        previewRef.current,
        rtmpUrls,
        project.settings?.bitrate ?? 8,
        project.settings?.fps ?? 30,
        project.settings?.resolution ?? '1080p',
        audio.active && audio.stream.current ? audio.stream.current : undefined,
        alerts.alertRef,
      )
      setStreamStatus('live')
      if (twitchToken && TWITCH_CLIENT_ID) {
        alerts.connect(twitchToken, TWITCH_CLIENT_ID).catch(console.error)
      }
    } catch (e) {
      console.error('Stream start failed:', e)
      setStreamStatus('idle')
    }
  }

  const endStream = async () => {
    alerts.disconnect()
    await streamer.stop()
    setStreamStatus('idle')
    setShowStreaming(false)
  }

  const addSource = async (type: Source['type']) => {
    const names: Record<Source['type'], string> = {
      camera: 'Webcam', screen: 'Screen capture', avatar: 'Avatar cam',
      image: 'Image overlay', audio: 'Microphone', text: 'Text overlay',
    }

    let deviceId: string | undefined
    if (type === 'camera' || type === 'avatar') {
      try {
        const tempStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        tempStream.getTracks().forEach(t => t.stop())
        const devices = await navigator.mediaDevices.enumerateDevices()
        const videoDevices = devices.filter(d => d.kind === 'videoinput')
        if (videoDevices.length > 0) deviceId = videoDevices[0].deviceId
      } catch { /* permission denied */ }
    }

    const newSource: Source = {
      id: `src-${Date.now()}`,
      type,
      name: names[type],
      visible: true,
      x: 40, y: 40,
      width: type === 'avatar' ? 120 : type === 'audio' ? 0 : type === 'text' ? 400 : 240,
      height: type === 'avatar' ? 120 : type === 'audio' ? 0 : type === 'text' ? 40 : 135,
      deviceId,
      text: type === 'text' ? 'Your text here...' : undefined,
      scrolling: type === 'text' ? false : undefined,
      anchor: type === 'text' ? 'free' : undefined,
    }

    setProject(p => ({
      ...p,
      scenes: p.scenes.map(scene =>
        scene.id === p.activeSceneId
          ? { ...scene, sources: [...scene.sources, newSource] }
          : scene
      ),
    }))
  }

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <TooltipContext.Provider value={project.settings?.showTooltips ?? true}>
    <>
      {splash && <SplashScreen onDone={() => setSplash(false)} />}
      <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-950 overflow-hidden">
        <Titlebar
          dark={dark}
          onToggleDark={() => setDark(d => !d)}
          onOpenSettings={() => setShowSettings(true)}
          isRecording={isRecording}
          onToggleRecord={toggleRecord}
          recordingTime={formatTime(recordSeconds)}
          streamStatus={streamStatus}
          onOpenStreaming={() => setShowStreaming(true)}
          liveTime={formatTime(liveSeconds)}
        />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar
            scenes={project.scenes}
            activeSceneId={project.activeSceneId}
            loadouts={project.loadouts ?? []}
            onSelectScene={selectScene}
            onAddScene={addScene}
            onRemoveScene={removeScene}
            onRenameScene={renameScene}
            onSaveLoadout={saveLoadout}
            onLoadLoadout={loadLoadout}
            onDeleteLoadout={deleteLoadout}
          />
          <Canvas
            scene={activeScene}
            isRecording={isRecording}
            recordingTime={formatTime(recordSeconds)}
            onUpdateSource={updateSource}
            onUpdateBackground={updateBackground}
            previewRef={previewRef}
            onExportLayout={handleExportLayout}
            onImportLayout={handleImportLayout}
            onOpenOverlays={() => setShowOverlays(true)}
          />
          <SourcesPanel
            sources={activeScene.sources}
            onToggleVisible={toggleSourceVisible}
            onAddSource={addSource}
            onRemoveSource={removeSource}
            onReorderSource={reorderSource}
            onChangeCameraDevice={changeCameraDevice}
            onChangeVolume={changeVolume}
            onUpdateSource={updateSource}
            cameraDevices={cameraDevices}
            audioLevel={audio.level}
          />
        </div>
      </div>

      {recordingResult && (
        <PlaybackModal
          recording={recordingResult}
          saveFolder={project.settings?.saveFolder ?? ''}
          onClose={() => setRecordingResult(null)}
        />
      )}
      {showOverlays && (
        <OverlaysModal
          onLoad={handleLoadTemplate}
          onAddAsset={addAssetSource}
          onClose={() => setShowOverlays(false)}
        />
      )}
      {showStreaming && (
        <StreamingModal
          onGoLive={goLive}
          onEndStream={endStream}
          status={streamStatus}
          liveTime={formatTime(liveSeconds)}
          onClose={() => setShowStreaming(false)}
        />
      )}
      {showSettings && (
        <SettingsModal
          settings={project.settings ?? defaultSettings}
          saveFolder={project.settings?.saveFolder ?? ''}
          onSave={(newSettings, newFolder) =>
            setProject(p => ({ ...p, settings: { ...newSettings, saveFolder: newFolder } }))
          }
          onClose={() => setShowSettings(false)}
        />
      )}
    </>
    </TooltipContext.Provider>
  )
}
