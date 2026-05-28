import { useState, useEffect, useCallback, useRef } from 'react'
import Titlebar from './components/Titlebar'
import Sidebar from './components/Sidebar'
import Canvas from './components/Canvas'
import SourcesPanel from './components/SourcesPanel'
import PlaybackModal from './components/PlaybackModal'
import OverlaysModal from './components/OverlaysModal'
import { Scene, Source, SceneBackground, Loadout, SlateProject, loadProject, saveProject, defaultProject, defaultSettings, loadTermsAccepted, saveTermsAccepted } from './store'
import { TooltipContext } from './contexts/TooltipContext'
import SettingsModal from './components/SettingsModal'
import StreamingModal from './components/StreamingModal'
import SplashScreen from './components/SplashScreen'
import { useRecorder, RecordingResult } from './hooks/useRecorder'
import { useStreamer } from './hooks/useStreamer'
import { useAlerts } from './hooks/useAlerts'
import { useChat } from './hooks/useChat'
import ChatOverlay from './components/ChatOverlay'
import { useAudioCapture } from './hooks/useAudioCapture'
import { useCameraDevices } from './hooks/useCameraDevices'
import { exportLayout, importLayout } from './lib/layoutShare'
import { screenRegistry } from './lib/streamRegistry'
import { OverlayTemplate } from './lib/overlayTemplates'
import { TWITCH_CLIENT_ID } from './config/platforms'
import { audioRegistry } from './lib/audioRegistry'
import { ActiveAlert } from './hooks/useAlerts'
import { reportCrash } from './lib/crashReporter'
import TermsModal from './components/TermsModal'

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
  const [termsAccepted, setTermsAccepted] = useState<boolean | null>(null)
  const [dark, setDark] = useState(true)
  const [subCurrent, setSubCurrent] = useState(0)
  const [subGoal, setSubGoal] = useState(50)
  // Refs so the onSubRef callback always sees the latest values without stale closures
  const subCurrentRef = useRef(0)
  const subGoalRef    = useRef(50)
  subCurrentRef.current = subCurrent
  subGoalRef.current    = subGoal
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const liveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const mixCtxRef = useRef<AudioContext | null>(null)

  const recorder = useRecorder()
  const streamer = useStreamer()
  const alerts = useAlerts()
  const chat = useChat()
  const audio = useAudioCapture()
  const cameraDevices = useCameraDevices()

  // ── Effects (all hooks must come before any conditional return) ────────

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])

  // Global JS error reporting — catches uncaught exceptions and unhandled promise rejections
  useEffect(() => {
    const onError = (e: ErrorEvent) => {
      void reportCrash({ type: 'js_error', message: `${e.message} (${e.filename}:${e.lineno})` })
    }
    const onUnhandled = (e: PromiseRejectionEvent) => {
      void reportCrash({ type: 'unhandled_rejection', message: String(e.reason) })
    }
    window.addEventListener('error', onError)
    window.addEventListener('unhandledrejection', onUnhandled)
    return () => {
      window.removeEventListener('error', onError)
      window.removeEventListener('unhandledrejection', onUnhandled)
    }
  }, [])

  // Check terms acceptance on mount
  useEffect(() => {
    loadTermsAccepted().then(setTermsAccepted)
  }, [])

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

  // Global mic on/off — independent of scenes so audio never cuts out when switching scenes.
  // Per-scene audio sources only control volume; this toggle controls capture entirely.
  const [micOn, setMicOn] = useState(true)
  const micVolume = activeScene.sources.find(s => s.type === 'audio')?.volume ?? 1

  useEffect(() => {
    if (micOn) audio.start()
    else audio.stop()
  }, [micOn]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    audio.setGain(micVolume)
  }, [micVolume]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isRecording) recorder.updateScene(activeScene)
  }, [activeScene, isRecording]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (streamStatus === 'live') streamer.updateScene(activeScene)
  }, [activeScene, streamStatus]) // eslint-disable-line react-hooks/exhaustive-deps

  // Global hotkeys
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement).isContentEditable) return

      // Ctrl+Shift+L — Go Live / open streaming modal
      if (e.ctrlKey && e.shiftKey && e.key === 'L') {
        e.preventDefault()
        if (streamStatus === 'idle') setShowStreaming(true)
        return
      }
      // Ctrl+Shift+E — End stream
      if (e.ctrlKey && e.shiftKey && e.key === 'E') {
        e.preventDefault()
        if (streamStatus === 'live') endStream()
        return
      }
      // Ctrl+Shift+R — Toggle recording
      if (e.ctrlKey && e.shiftKey && e.key === 'R') {
        e.preventDefault()
        toggleRecord()
        return
      }

      // 1–9 — switch scene
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

  // Auto-increment sub goal counter when Twitch fires subscribe / gift_sub events
  useEffect(() => {
    alerts.onSubRef.current = (type, amount) => {
      const increment = type === 'gift_sub' ? (amount ?? 1) : 1
      const newCurrent = subCurrentRef.current + increment
      setSubCurrent(newCurrent)
      updateSubGoal(newCurrent, subGoalRef.current)
    }
    return () => { alerts.onSubRef.current = null }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Handlers ──────────────────────────────────────────────────────────

  // Mixes mic stream + any screen-capture audio streams into one MediaStream.
  // Returns undefined if no audio is available at all.
  const buildAudioStream = (): MediaStream | undefined => {
    const streams: MediaStream[] = []
    if (audio.stream.current) streams.push(audio.stream.current)
    audioRegistry.getAll().forEach(s => { if (s.getAudioTracks().length > 0) streams.push(s) })
    if (streams.length === 0) return undefined
    if (streams.length === 1) return streams[0]
    // Mix multiple sources via Web Audio API
    if (mixCtxRef.current) mixCtxRef.current.close().catch(() => {})
    const ctx = new AudioContext()
    mixCtxRef.current = ctx
    const dest = ctx.createMediaStreamDestination()
    streams.forEach(s => ctx.createMediaStreamSource(s).connect(dest))
    return dest.stream
  }

  const toggleRecord = async () => {
    if (isRecording) {
      setIsRecording(false)
      if (mixCtxRef.current) { mixCtxRef.current.close().catch(() => {}); mixCtxRef.current = null }
      const result = await recorder.stop()
      if (result) setRecordingResult(result)
    } else {
      if (!previewRef.current) return
      setIsRecording(true)
      recorder.start(
        activeScene,
        previewRef.current,
        project.settings?.resolution ?? '1080p',
        buildAudioStream(),
        alerts.alertRef,
      )
    }
  }

  const selectScene = (id: string) => setProject(p => ({ ...p, activeSceneId: id }))

  const addScene = () => {
    const id = `scene-${Date.now()}`
    // New scenes start with mic on so streamers never go live with no audio
    const newScene: Scene = {
      id,
      name: `Scene ${project.scenes.length + 1}`,
      sources: [
        { id: `src-mic-${Date.now()}`, type: 'audio', name: 'Microphone', visible: true, x: 0, y: 0, width: 0, height: 0, volume: 1 },
      ],
    }
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

  // Global mic toggle — one button controls capture for the entire stream/recording
  const toggleMic = useCallback(() => setMicOn(m => !m), [])

  const removeSource = useCallback((sourceId: string) => {
    // Release any persistent screen capture stream for this source
    screenRegistry.release(sourceId)
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

  // Update the sub goal number in any scene containing a "Sub goal" text source
  const updateSubGoal = useCallback((current: number, goal: number) => {
    const text = `  ⭐ Sub Goal: ${current} / ${goal}  —  Help us reach the goal!  ⭐`
    setProject(p => ({
      ...p,
      scenes: p.scenes.map(scene => ({
        ...scene,
        sources: scene.sources.map(src =>
          src.name === 'Sub goal' && src.type === 'text'
            ? { ...src, text }
            : src
        ),
      })),
    }))
  }, [])

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
        buildAudioStream(),
        alerts.alertRef,
        () => {
          // Stream dropped unexpectedly (ffmpeg crash / network error)
          alerts.disconnect()
          chat.disconnect()
          setStreamStatus('idle')
        },
      )
      setStreamStatus('live')
      if (twitchToken && TWITCH_CLIENT_ID) {
        alerts.connect(twitchToken, TWITCH_CLIENT_ID).catch(console.error)
        // Derive channel name from token — fetch /users and grab login name
        fetch('https://api.twitch.tv/helix/users', {
          headers: { Authorization: `Bearer ${twitchToken}`, 'Client-Id': TWITCH_CLIENT_ID },
        })
          .then(r => r.json())
          .then(d => { const login = d.data?.[0]?.login; if (login) chat.connect(twitchToken, login) })
          .catch(console.error)
      }
    } catch (e) {
      console.error('Stream start failed:', e)
      setStreamStatus('idle')
    }
  }

  const endStream = async () => {
    alerts.disconnect()
    chat.disconnect()
    // Hard 6-second timeout so endStream can never hang the UI
    await Promise.race([
      streamer.stop(),
      new Promise<void>(r => setTimeout(r, 6000)),
    ])
    setStreamStatus('idle')
    setShowStreaming(false)
  }

  const addSource = async (type: Source['type']) => {
    const names: Record<Source['type'], string> = {
      camera: 'Webcam', screen: 'Screen capture', avatar: 'Avatar cam',
      image: 'Image overlay', audio: 'Microphone', text: 'Text overlay', music: 'Background music',
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
      width: type === 'avatar' ? 120 : type === 'audio' || type === 'music' ? 0 : type === 'text' ? 400 : 240,
      height: type === 'avatar' ? 120 : type === 'audio' || type === 'music' ? 0 : type === 'text' ? 40 : 135,
      deviceId,
      text: type === 'text' ? 'Your text here...' : undefined,
      loop: type === 'music' ? true : undefined,
      volume: type === 'music' ? 0.7 : undefined,
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
      {termsAccepted === false && (
        <TermsModal onAccept={() => { void saveTermsAccepted(); setTermsAccepted(true) }} />
      )}
      {splash && termsAccepted !== false && <SplashScreen onDone={() => setSplash(false)} />}
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
          micEnabled={micOn}
          onToggleMic={toggleMic}
          audioLevel={audio.level}
          streamStats={streamer.streamStats}
          subCurrent={subCurrent}
          subGoal={subGoal}
          onUpdateSubGoal={(c, g) => { setSubCurrent(c); setSubGoal(g); updateSubGoal(c, g) }}
          onClip={() => streamer.clip(project.settings?.saveFolder).then(p => { if (p) console.log('Clip saved:', p) })}
          isClipping={streamer.isClipping}
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
          <div className="relative flex-1 min-w-0 flex flex-col">
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
              isActiveScene={true}
            />
            {alerts.activeAlert && <AlertOverlay alert={alerts.activeAlert} />}
            {streamStatus === 'live' && <ChatOverlay messages={chat.messages} />}
          </div>
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
          onRestoreScenes={() => {
            const defaultNames = ['Starting Soon', 'Sub Goal', 'New Sub!', 'Raid!', 'End Screen']
            const existing = new Set(project.scenes.map(s => s.name))
            const toAdd = defaultProject.scenes.filter(s => defaultNames.includes(s.name) && !existing.has(s.name))
            if (toAdd.length > 0) setProject(p => ({ ...p, scenes: [...p.scenes, ...toAdd] }))
          }}
          onClose={() => setShowSettings(false)}
        />
      )}
    </>
    </TooltipContext.Provider>
  )
}

const ALERT_LABELS: Record<string, string> = {
  follow: 'New Follower', subscribe: 'New Subscriber', gift_sub: 'Gift Subs',
  cheer: 'Bits Cheer', raid: 'Raid',
}
const ALERT_MAIN: Record<string, (a: ActiveAlert) => string> = {
  follow:    a => `${a.event.username} followed!`,
  subscribe: a => `${a.event.username} subscribed!`,
  gift_sub:  a => `${a.event.username} gifted ${a.event.amount ?? ''} subs!`,
  cheer:     a => `${a.event.username} cheered ${a.event.amount ?? ''} bits!`,
  raid:      a => `${a.event.username} raided with ${a.event.amount ?? ''} viewers!`,
}

function AlertOverlay({ alert }: { alert: ActiveAlert }) {
  return (
    <div className="absolute inset-x-0 top-3 flex justify-center pointer-events-none z-40">
      <div
        key={alert.startedAt}
        style={{
          animation: `alert-slide ${alert.duration}ms ease forwards`,
          background: 'rgba(14,14,26,0.93)',
          border: '1.5px solid #7c3aed',
          minWidth: 240, maxWidth: 320, borderRadius: 12,
        }}
        className="flex items-stretch overflow-hidden shadow-2xl"
      >
        <div style={{ width: 4, background: 'linear-gradient(#7c3aed,#7c3aed)', borderRadius: '12px 0 0 12px', flexShrink: 0 }} />
        <div className="px-3 py-2.5">
          <div className="text-violet-300 text-[11px] font-medium leading-none mb-1">
            {ALERT_LABELS[alert.event.type] ?? ''}
          </div>
          <div className="text-white text-sm font-bold leading-none">
            {(ALERT_MAIN[alert.event.type] ?? (() => ''))(alert)}
          </div>
        </div>
      </div>
    </div>
  )
}
