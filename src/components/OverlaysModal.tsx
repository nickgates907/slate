import { useState } from 'react'
import { overlayTemplates, OverlayTemplate } from '../lib/overlayTemplates'
import { builtInAssets, BuiltInAsset } from '../lib/builtInAssets'
import { Source } from '../store'

interface OverlaysModalProps {
  onLoad: (template: OverlayTemplate) => void
  onAddAsset: (source: Omit<Source, 'id'>) => void
  onClose: () => void
}

type Tab = 'templates' | 'assets'

const CATEGORY_LABELS: Record<string, string> = {
  frame: 'Webcam Frames',
  lowerthird: 'Lower Thirds',
  fullscreen: 'Full-Screen',
  alert: 'Alert Cards',
}

export default function OverlaysModal({ onLoad, onAddAsset, onClose }: OverlaysModalProps) {
  const [tab, setTab] = useState<Tab>('templates')

  const categories = ['frame', 'lowerthird', 'fullscreen', 'alert'] as const

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={onClose}>
      <div
        className="bg-gray-900 rounded-2xl shadow-2xl overflow-hidden w-[520px] max-h-[80vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-800 shrink-0">
          <span className="text-white font-semibold text-sm">Overlays</span>
          <div className="flex-1" />
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors text-lg leading-none">×</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-800 shrink-0">
          {(['templates', 'assets'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${
                tab === t
                  ? 'text-white border-b-2 border-brand-red'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {t === 'templates' ? 'Scene Templates' : 'Built-in Assets'}
            </button>
          ))}
        </div>

        <div className="overflow-y-auto flex-1">
          {tab === 'templates' ? (
            <div className="p-4 flex flex-col gap-2">
              {overlayTemplates.map(t => (
                <button
                  key={t.id}
                  onClick={() => { onLoad(t); onClose() }}
                  className="flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 transition-colors group"
                >
                  <span className="text-2xl">{t.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-sm font-semibold">{t.label}</div>
                    <div className="text-gray-400 text-xs">{t.description}</div>
                  </div>
                  <span className="text-xs text-brand-red font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                    Load →
                  </span>
                </button>
              ))}
              <p className="text-gray-600 text-xs px-1 pt-1">Loads as a new scene. Your existing scenes are not changed.</p>
            </div>
          ) : (
            <div className="p-4 space-y-5">
              {categories.map(cat => {
                const items = builtInAssets.filter(a => a.category === cat)
                return (
                  <div key={cat}>
                    <p className="text-gray-500 text-xs font-semibold uppercase tracking-widest mb-2">
                      {CATEGORY_LABELS[cat]}
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {items.map(asset => (
                        <AssetCard key={asset.id} asset={asset} onAdd={(src) => { onAddAsset(src); onClose() }} />
                      ))}
                    </div>
                  </div>
                )
              })}
              <p className="text-gray-600 text-xs px-1">Adds directly to the current scene as an image source.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function AssetCard({ asset, onAdd }: { asset: BuiltInAsset; onAdd: (src: Omit<Source, 'id'>) => void }) {
  return (
    <button
      onClick={() => onAdd({
        type: 'image',
        name: asset.name,
        visible: true,
        x: asset.category === 'fullscreen' ? 0 : 40,
        y: asset.category === 'lowerthird' ? 310 : asset.category === 'fullscreen' ? 0 : 40,
        width: asset.defaultW,
        height: asset.defaultH,
        imageSrc: asset.src,
      })}
      className="flex flex-col items-center gap-2 p-3 rounded-xl bg-gray-800 hover:bg-gray-700 transition-colors group"
    >
      <div className="w-full h-16 rounded-lg overflow-hidden bg-gray-950 flex items-center justify-center">
        <img src={asset.src} alt={asset.name} className="max-w-full max-h-full object-contain" />
      </div>
      <span className="text-xs text-gray-400 group-hover:text-white transition-colors text-center leading-tight">
        {asset.name}
      </span>
    </button>
  )
}
