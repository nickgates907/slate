import { useState } from 'react'
import { Source } from '../store'

interface TextTileProps {
  source: Source
  onUpdate: (updates: Partial<Source>) => void
}

export default function TextTile({ source, onUpdate }: TextTileProps) {
  const [editing, setEditing] = useState(false)
  const text = source.text ?? 'Enter text...'
  const fontSize = source.fontSize ?? 16
  const color = source.color ?? '#ffffff'

  const commitEdit = (value: string) => {
    onUpdate({ text: value })
    setEditing(false)
  }

  return (
    <div
      className="w-full h-full flex items-center px-3 overflow-hidden relative group/text"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
      onDoubleClick={() => setEditing(true)}
    >
      {source.scrolling
        ? (
          <div
            className="whitespace-nowrap font-semibold animate-[marquee_12s_linear_infinite]"
            style={{ fontSize, color }}
          >
            {text}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{text}
          </div>
        )
        : (
          <span
            className="font-semibold truncate"
            style={{ fontSize, color }}
          >
            {text}
          </span>
        )
      }

      {/* Inline editor — appears on double-click or Edit button */}
      {editing && (
        <textarea
          autoFocus
          defaultValue={text}
          onMouseDown={e => e.stopPropagation()}
          onBlur={e => commitEdit(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Escape') setEditing(false)
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); commitEdit(e.currentTarget.value) }
          }}
          className="absolute inset-0 w-full h-full bg-black/90 text-white font-semibold px-3 py-2 resize-none outline-none border border-brand-red"
          style={{ fontSize, color }}
        />
      )}

      {!editing && (
        <button
          onMouseDown={e => e.stopPropagation()}
          onClick={() => setEditing(true)}
          className="absolute right-1.5 opacity-0 group-hover/text:opacity-100 transition-opacity bg-brand-red text-white text-xs rounded px-1.5 py-0.5"
        >
          Edit
        </button>
      )}
    </div>
  )
}
