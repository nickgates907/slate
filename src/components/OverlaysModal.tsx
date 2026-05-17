import { overlayTemplates, OverlayTemplate } from '../lib/overlayTemplates'

interface OverlaysModalProps {
  onLoad: (template: OverlayTemplate) => void
  onClose: () => void
}

export default function OverlaysModal({ onLoad, onClose }: OverlaysModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={onClose}>
      <div
        className="bg-gray-900 rounded-2xl shadow-2xl overflow-hidden w-[480px]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-800">
          <span className="text-white font-semibold text-sm">Overlay Templates</span>
          <div className="flex-1" />
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors text-lg leading-none">×</button>
        </div>

        {/* Template list */}
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
        </div>

        <div className="px-5 py-3 border-t border-gray-800">
          <p className="text-gray-500 text-xs">Loads as a new scene. Your existing scenes are not changed.</p>
        </div>
      </div>
    </div>
  )
}
