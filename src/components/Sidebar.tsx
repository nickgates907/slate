import { useState } from 'react'
import { Scene } from '../store'
import Tooltip from './Tooltip'

interface SidebarProps {
  scenes: Scene[]
  activeSceneId: string
  onSelectScene: (id: string) => void
  onAddScene: () => void
  onRemoveScene: (id: string) => void
  onRenameScene: (id: string, name: string) => void
}

export default function Sidebar({ scenes, activeSceneId, onSelectScene, onAddScene, onRemoveScene, onRenameScene }: SidebarProps) {
  const [editingId, setEditingId] = useState<string | null>(null)

  const commitRename = (id: string, value: string) => {
    const trimmed = value.trim()
    if (trimmed) onRenameScene(id, trimmed)
    setEditingId(null)
  }

  return (
    <div className="w-52 flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex-shrink-0">

      <div className="px-3 pt-3 pb-1 text-xs font-bold text-gray-400 dark:text-gray-600 tracking-widest uppercase">
        Scenes
      </div>

      <div className="flex-1">
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

      <div className="px-3 py-2 border-t border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-600">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          Double-click to rename
        </div>
      </div>

    </div>
  )
}
