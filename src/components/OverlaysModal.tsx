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

  const generalTemplates = overlayTemplates.filter(t => t.category === 'general')
  const affiliateTemplates = overlayTemplates.filter(t => t.category === 'affiliate')

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-shell overflow-hidden w-[520px] max-h-[80vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-black/[0.08] dark:border-white/[0.08] shrink-0">
          <span className="text-gray-900 dark:text-white font-semibold text-sm">Overlays</span>
          <div className="flex-1" />
          <button onClick={onClose} className="text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors text-lg leading-none">×</button>
        </div>

        {/* Tabs */}
        <div className="px-4 pt-3 pb-1 shrink-0">
          <div className="pill-group w-full">
            {(['templates', 'assets'] as Tab[]).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`pill flex-1 justify-center ${tab === t ? 'pill-active' : ''}`}
              >
                {t === 'templates' ? 'Scene Templates' : 'Built-in Assets'}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-y-auto flex-1">
          {tab === 'templates' ? (
            <div className="p-4 flex flex-col gap-1">

              {/* General templates */}
              <p className="section-label px-1 pb-1">General</p>
              {generalTemplates.map(t => (
                <TemplateRow key={t.id} template={t} onLoad={() => { onLoad(t); onClose() }} />
              ))}

              {/* Affiliate templates */}
              <div className="flex items-center gap-2 mt-3 mb-1 px-1">
                <p className="text-[#9147ff] text-xs font-semibold uppercase tracking-widest">Twitch Affiliate</p>
                <div className="flex-1 h-px bg-[#9147ff]/20" />
              </div>
              {affiliateTemplates.map(t => (
                <TemplateRow key={t.id} template={t} onLoad={() => { onLoad(t); onClose() }} affiliate />
              ))}

              <p className="text-gray-400 dark:text-gray-600 text-xs px-1 pt-2">Loads as a new scene. Your existing scenes are not changed.</p>
            </div>
          ) : (
            <div className="p-4 space-y-5">
              {categories.map(cat => {
                const items = builtInAssets.filter(a => a.category === cat)
                return (
                  <div key={cat}>
                    <p className="section-label mb-2">
                      {CATEGORY_LABELS[cat]}
                    </p>
                    <div className="grid gap-2 grid-cols-3">
                      {items.map(asset => (
                        <AssetCard key={asset.id} asset={asset} onAdd={(src) => { onAddAsset(src); onClose() }} />
                      ))}
                    </div>
                  </div>
                )
              })}
              <p className="text-gray-400 dark:text-gray-600 text-xs px-1">Adds directly to the current scene as an image source.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function TemplateRow({ template, onLoad, affiliate }: { template: OverlayTemplate; onLoad: () => void; affiliate?: boolean }) {
  return (
    <button
      onClick={onLoad}
      className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl transition-all duration-200 hover:-translate-y-0.5 group ${
        affiliate
          ? 'bg-[#9147ff]/10 hover:bg-[#9147ff]/20 border border-[#9147ff]/20'
          : 'card-panel hover:bg-surface-card-hover dark:hover:bg-surface-dark-card-hover'
      }`}
    >
      <span className="text-2xl">{template.icon}</span>
      <div className="flex-1 min-w-0">
        <div className="text-gray-900 dark:text-white text-sm font-semibold">{template.label}</div>
        <div className="text-gray-500 dark:text-gray-400 text-xs">{template.description}</div>
      </div>
      <span className={`text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity ${affiliate ? 'text-[#9147ff]' : 'text-brand-red'}`}>
        Load →
      </span>
    </button>
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
      className="accent-gradient-border-hover card-panel hover:bg-surface-card-hover dark:hover:bg-surface-dark-card-hover hover:border-brand-red flex flex-col items-center gap-2 p-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(0,0,0,0.4),0_0_12px_rgb(var(--accent-rgb)/0.25)] group"
    >
      <div className="w-full h-16 rounded-lg overflow-hidden bg-surface-canvas flex items-center justify-center">
        <img src={asset.src} alt={asset.name} className="max-w-full max-h-full object-contain" />
      </div>
      <span className="text-xs text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors text-center leading-tight">
        {asset.name}
      </span>
    </button>
  )
}
