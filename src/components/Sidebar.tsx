import { useState } from 'react'
import { Scene, Loadout } from '../store'
import Tooltip from './Tooltip'
import { encodeLoadout, decodeLoadout } from '../lib/layoutShare'

interface SidebarProps {
  scenes: Scene[]
  activeSceneId: string
  loadouts: Loadout[]
  onSelectScene: (id: string) => void
  onAddScene: () => void
  onRemoveScene: (id: string) => void
  onRenameScene: (id: string, name: string) => void
  onSaveLoadout: (name: string) => void
  onLoadLoadout: (loadout: Loadout) => void
  onDeleteLoadout: (id: string) => void
  onImportCode: (name: string, scenes: Scene[]) => void
}

export default function Sidebar({
  scenes, activeSceneId, loadouts,
  onSelectScene, onAddScene, onRemoveScene, onRenameScene,
  onSaveLoadout, onLoadLoadout, onDeleteLoadout, onImportCode,
}: SidebarProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showLoadouts, setShowLoadouts] = useState(false)
  const [savingName, setSavingName] = useState('')
  const [showSaveInput, setShowSaveInput] = useState(false)

  // Share modal
  const [shareCode, setShareCode] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    if (!shareCode) return
    navigator.clipboard.writeText(shareCode).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  // Import modal
  const [showImport, setShowImport] = useState(false)
  const [importInput, setImportInput] = useState('')
  const [importError, setImportError] = useState<string | null>(null)

  const handleImport = () => {
    const result = decodeLoadout(importInput.trim())
    if (!result) { setImportError('Invalid code — make sure you copied the full SLATE2-… text.'); return }
    onImportCode(result.name, result.scenes)
    setShowImport(false)
    setImportInput('')
    setImportError(null)
  }

  const commitRename = (id: string, value: string) => {
    const trimmed = value.trim()
    if (trimmed) onRenameScene(id, trimmed)
    setEditingId(null)
  }

  const handleSaveLoadout = () => {
    const name = savingName.trim() || `Loadout ${loadouts.length + 1}`
    onSaveLoadout(name)
    setSavingName('')
    setShowSaveInput(false)
  }

  return (
    <div className="w-52 flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex-shrink-0">

      <div className="px-3 pt-3 pb-1 text-xs font-bold text-gray-400 dark:text-gray-600 tracking-widest uppercase">
        Scenes
      </div>

      <div className="flex-1 overflow-y-auto">
        {scenes.map((scene, idx) => (
          <div
            key={scene.id}
            className={`group flex items-center border-l-2 transition-colors ${
              scene.id === activeSceneId
                ? 'bg-red-50 dark:bg-red-950 border-brand-red'
                : 'border-transparent hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            {editingId === scene.id ? (
              <input
                autoFocus
                defaultValue={scene.name}
                onBlur={e => commitRename(scene.id, e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') commitRename(scene.id, e.currentTarget.value)
                  if (e.key === 'Escape') setEditingId(null)
                }}
                className="flex-1 px-3 py-2 text-sm bg-transparent outline-none border-0 text-gray-800 dark:text-white"
              />
            ) : (
              <button
                onClick={() => onSelectScene(scene.id)}
                onDoubleClick={() => setEditingId(scene.id)}
                className={`flex-1 flex items-center gap-2 px-3 py-2 text-sm text-left ${
                  scene.id === activeSceneId
                    ? 'text-red-700 dark:text-red-400 font-semibold'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  scene.id === activeSceneId ? 'bg-brand-red' : 'bg-gray-300 dark:bg-gray-600'
                }`} />
                <span className="truncate">{scene.name}</span>
                <span className="ml-auto text-gray-300 dark:text-gray-700 text-xs flex-shrink-0">{idx + 1}</span>
              </button>
            )}
            {scenes.length > 1 && editingId !== scene.id && (
              <Tooltip text="Delete this scene" position="right">
                <button
                  onClick={() => onRemoveScene(scene.id)}
                  className="opacity-0 group-hover:opacity-100 pr-2 text-gray-300 dark:text-gray-700 hover:text-red-400 dark:hover:text-red-500 transition-all"
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </Tooltip>
            )}
          </div>
        ))}
      </div>

      <div className="p-2">
        <button
          onClick={onAddScene}
          className="w-full py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 border border-dashed border-gray-400 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-brand-red hover:text-brand-red transition-colors"
        >
          + New Scene
        </button>
      </div>

      {/* Loadouts section */}
      <div className="border-t border-gray-100 dark:border-gray-800">
        <button
          onClick={() => setShowLoadouts(v => !v)}
          className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold text-gray-400 dark:text-gray-600 tracking-widest uppercase hover:text-gray-600 dark:hover:text-gray-400 transition-colors"
        >
          <span>Loadouts</span>
          <svg
            width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
            className={`transition-transform ${showLoadouts ? 'rotate-180' : ''}`}
          >
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>

        {showLoadouts && (
          <div className="pb-2 px-2 space-y-1">
            {loadouts.length === 0 && (
              <p className="text-gray-500 text-xs px-1 py-1">No loadouts saved yet.</p>
            )}
            {loadouts.map(l => (
              <div key={l.id} className="group flex items-center gap-1">
                <button
                  onClick={() => onLoadLoadout(l)}
                  className="flex-1 text-left px-2 py-1.5 rounded-lg text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-colors truncate"
                >
                  {l.name}
                </button>
                <Tooltip text="Share as code" position="right">
                  <button
                    onClick={() => { setCopied(false); setShareCode(encodeLoadout(l.name, l.scenes)) }}
                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-brand-red transition-all p-1"
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                    </svg>
                  </button>
                </Tooltip>
                <button
                  onClick={() => onDeleteLoadout(l.id)}
                  className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-400 transition-all p-1"
                >
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            ))}

            {showSaveInput ? (
              <div className="flex gap-1 pt-1">
                <input
                  autoFocus
                  value={savingName}
                  onChange={e => setSavingName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleSaveLoadout(); if (e.key === 'Escape') setShowSaveInput(false) }}
                  placeholder={`Loadout ${loadouts.length + 1}`}
                  className="flex-1 text-xs px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-white outline-none border border-gray-300 dark:border-gray-700 focus:border-brand-red"
                />
                <button onClick={handleSaveLoadout} className="text-xs px-2 py-1 rounded-lg bg-brand-red text-white font-semibold">
                  Save
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowSaveInput(true)}
                className="w-full py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-500 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg hover:border-brand-red hover:text-brand-red transition-colors"
              >
                + Save current scenes
              </button>
            )}

            <button
              onClick={() => { setImportInput(''); setImportError(null); setShowImport(true) }}
              className="w-full py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-500 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg hover:border-brand-red hover:text-brand-red transition-colors flex items-center justify-center gap-1.5"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
              </svg>
              Import code
            </button>
          </div>
        )}
      </div>

      <div className="px-3 py-2 border-t border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-600">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          Double-click to rename
        </div>
      </div>

    </div>

    {/* ── Share modal ─────────────────────────────────────────────────────── */}
    {shareCode && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => setShareCode(null)}>
        <div className="bg-gray-900 rounded-2xl shadow-2xl w-[460px] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
          <div className="flex items-center px-5 py-4 border-b border-gray-800">
            <div>
              <p className="text-white font-semibold text-sm">Share Loadout</p>
              <p className="text-gray-500 text-xs mt-0.5">Copy this code and paste it into Slate on any PC</p>
            </div>
            <button onClick={() => setShareCode(null)} className="ml-auto text-gray-500 hover:text-white text-lg leading-none">×</button>
          </div>
          <div className="p-5 flex flex-col gap-4">
            <textarea
              readOnly
              value={shareCode}
              className="w-full h-28 text-xs font-mono bg-gray-800 text-gray-300 rounded-xl p-3 resize-none outline-none border border-gray-700 select-all"
              onClick={e => (e.target as HTMLTextAreaElement).select()}
            />
            <div className="rounded-xl bg-gray-800/60 px-3.5 py-2.5 text-xs text-gray-500 leading-relaxed">
              Includes all scenes, overlays, text, and images.{' '}
              <span className="text-gray-400">Music files and camera/screen sources need to be re-added on the other PC.</span>
            </div>
            <button
              onClick={handleCopy}
              className="w-full py-2.5 rounded-xl font-semibold text-sm transition-colors"
              style={{ background: copied ? '#22c55e' : '#FF4D4D', color: 'white' }}
            >
              {copied ? '✓ Copied!' : 'Copy Code'}
            </button>
          </div>
        </div>
      </div>
    )}

    {/* ── Import modal ────────────────────────────────────────────────────── */}
    {showImport && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => setShowImport(false)}>
        <div className="bg-gray-900 rounded-2xl shadow-2xl w-[460px] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
          <div className="flex items-center px-5 py-4 border-b border-gray-800">
            <div>
              <p className="text-white font-semibold text-sm">Import Loadout</p>
              <p className="text-gray-500 text-xs mt-0.5">Paste a SLATE2-… code to restore someone&apos;s setup</p>
            </div>
            <button onClick={() => setShowImport(false)} className="ml-auto text-gray-500 hover:text-white text-lg leading-none">×</button>
          </div>
          <div className="p-5 flex flex-col gap-4">
            <textarea
              autoFocus
              value={importInput}
              onChange={e => { setImportInput(e.target.value); setImportError(null) }}
              placeholder="Paste your SLATE2-… code here"
              className="w-full h-28 text-xs font-mono bg-gray-800 text-gray-300 rounded-xl p-3 resize-none outline-none border border-gray-700 placeholder-gray-600 focus:border-brand-red"
            />
            {importError && (
              <p className="text-red-400 text-xs">{importError}</p>
            )}
            <button
              onClick={handleImport}
              disabled={!importInput.trim()}
              className="w-full py-2.5 rounded-xl font-semibold text-sm transition-colors"
              style={{
                background: importInput.trim() ? '#FF4D4D' : 'rgba(255,255,255,0.06)',
                color: importInput.trim() ? 'white' : 'rgba(255,255,255,0.25)',
                cursor: importInput.trim() ? 'pointer' : 'not-allowed',
              }}
            >
              Import &amp; Apply
            </button>
          </div>
        </div>
      </div>
    )}
  )
}
