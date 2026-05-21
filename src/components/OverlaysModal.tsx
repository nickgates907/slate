import { useState } from 'react'
import { writeBinaryFile, createDir } from '@tauri-apps/api/fs'
import { join, documentDir } from '@tauri-apps/api/path'
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
  panel: 'Twitch Channel Panels',
}

export default function OverlaysModal({ onLoad, onAddAsset, onClose }: OverlaysModalProps) {
  const [tab, setTab] = useState<Tab>('templates')
  const [downloadedId, setDownloadedId] = useState<string | null>(null)

  const categories = ['frame', 'lowerthird', 'fullscreen', 'alert', 'panel'] as const

  const generalTemplates = overlayTemplates.filter(t => t.category === 'general')
  const affiliateTemplates = overlayTemplates.filter(t => t.category === 'affiliate')

  const downloadPanel = async (asset: BuiltInAsset) => {
    try {
      const encoded = asset.src.split(',')[1]
      const svgText = decodeURIComponent(encoded)
      const bytes = new TextEncoder().encode(svgText)
      const dir = await join(await documentDir(), 'Slate', 'Twitch Panels')
      await createDir(dir, { recursive: true })
      const path = await join(dir, `${asset.name}.svg`)
      await writeBinaryFile(path, bytes)
      setDownloadedId(asset.id)
      setTimeout(() => setDownloadedId(null), 2000)
    } catch (e) {
      console.error('Panel download failed:', e)
    }
  }

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
            <div className="p-4 flex flex-col gap-1">

              {/* General templates */}
              <p className="text-gray-500 text-xs font-semibold uppercase tracking-widest px-1 pb-1">General</p>
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

              <p className="text-gray-600 text-xs px-1 pt-2">Loads as a new scene. Your existing scenes are not changed.</p>
            </div>
          ) : (
            <div className="p-4 space-y-5">
              {categories.map(cat => {
                const items = builtInAssets.filter(a => a.category === cat)
                const isPanels = cat === 'panel'
                return (
                  <div key={cat}>
                    <div className="flex items-center gap-2 mb-2">
                      <p className={`text-xs font-semibold uppercase tracking-widest ${isPanels ? 'text-[#9147ff]' : 'text-gray-500'}`}>
                        {CATEGORY_LABELS[cat]}
                      </p>
                      {isPanels && (
                        <span className="text-[10px] text-[#9147ff]/60 font-medium">— upload to Twitch About page</span>
                      )}
                    </div>
                    <div className={`grid gap-2 ${isPanels ? 'grid-cols-2' : 'grid-cols-3'}`}>
                      {items.map(asset => isPanels
                        ? (
                          <PanelCard
                            key={asset.id}
                            asset={asset}
                            downloaded={downloadedId === asset.id}
                            onDownload={() => downloadPanel(asset)}
                            onAdd={() => { onAddAsset({
                              type: 'image', name: asset.name, visible: true,
                              x: 160, y: 130, width: asset.defaultW, height: asset.defaultH,
                              imageSrc: asset.src,
                            }); onClose() }}
                          />
                        ) : (
                          <AssetCard key={asset.id} asset={asset} onAdd={(src) => { onAddAsset(src); onClose() }} />
                        )
                      )}
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

function TemplateRow({ template, onLoad, affiliate }: { template: OverlayTemplate; onLoad: () => void; affiliate?: boolean }) {
  return (
    <button
      onClick={onLoad}
      className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl transition-colors group ${
        affiliate
          ? 'bg-[#9147ff]/10 hover:bg-[#9147ff]/20 border border-[#9147ff]/20'
          : 'bg-gray-800 hover:bg-gray-700'
      }`}
    >
      <span className="text-2xl">{template.icon}</span>
      <div className="flex-1 min-w-0">
        <div className="text-white text-sm font-semibold">{template.label}</div>
        <div className="text-gray-400 text-xs">{template.description}</div>
      </div>
      <span className={`text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity ${affiliate ? 'text-[#9147ff]' : 'text-brand-red'}`}>
        Load →
      </span>
    </button>
  )
}

function PanelCard({ asset, downloaded, onDownload, onAdd }: {
  asset: BuiltInAsset
  downloaded: boolean
  onDownload: () => void
  onAdd: () => void
}) {
  return (
    <div className="flex flex-col rounded-xl bg-gray-800 overflow-hidden border border-[#9147ff]/20">
      <div className="w-full h-14 bg-gray-950 flex items-center justify-center overflow-hidden">
        <img src={asset.src} alt={asset.name} className="w-full h-full object-cover" />
      </div>
      <div className="flex items-center gap-1 px-2 py-1.5">
        <span className="text-xs text-gray-300 flex-1 font-medium truncate">{asset.name}</span>
        <button
          onClick={onAdd}
          title="Add to scene"
          className="text-[10px] text-gray-500 hover:text-white px-1.5 py-0.5 rounded transition-colors"
        >
          + Scene
        </button>
        <button
          onClick={onDownload}
          title="Save SVG to Documents/Slate/Twitch Panels/"
          className={`text-[10px] px-1.5 py-0.5 rounded transition-colors font-semibold ${
            downloaded
              ? 'text-green-400'
              : 'text-[#9147ff] hover:text-white hover:bg-[#9147ff]/30'
          }`}
        >
          {downloaded ? '✓ Saved' : '↓ Download'}
        </button>
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
