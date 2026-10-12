import { useState, useEffect, useRef } from 'react'
import { open } from '@tauri-apps/api/dialog'
import { RecordingSettings } from '../store'
import { SKINS, BUNDLE_PRICE, isSkinOwned, DEFAULT_SKIN_ID, applySkin } from '../lib/skins'
import { redeemSkinCode } from '../lib/skinCodes'
import { purchaseBundle, BundlePurchaseStatus } from '../lib/bundlePurchase'
import Tooltip from './Tooltip'

interface SettingsModalProps {
  settings: RecordingSettings
  saveFolder: string
  onSave: (settings: RecordingSettings, saveFolder: string) => void
  onChangeSkin: (skinId: string) => void
  onUnlockSkins: (skinIds: string[]) => void
  onRestoreScenes: () => void
  onClose: () => void
}

export default function SettingsModal({ settings, saveFolder, onSave, onChangeSkin, onUnlockSkins, onRestoreScenes, onClose }: SettingsModalProps) {
  const [s, setS] = useState(settings)
  const [folder, setFolder] = useState(saveFolder)
  const [redeemInput, setRedeemInput] = useState('')
  const [redeeming, setRedeeming] = useState(false)
  const [redeemError, setRedeemError] = useState<string | null>(null)
  const [redeemSuccess, setRedeemSuccess] = useState<string | null>(null)
  const [showRedeemInput, setShowRedeemInput] = useState(false)
  const [purchasing, setPurchasing] = useState(false)
  const [purchaseStatus, setPurchaseStatus] = useState<BundlePurchaseStatus | null>(null)
  const [purchaseError, setPurchaseError] = useState<string | null>(null)

  // Hovering a locked skin swatch below previews it live via applySkin() without
  // touching `s.skin` or persisting anything. This ref always tracks the real
  // selected skin so that closing the modal mid-hover (no guaranteed mouseleave)
  // still reverts the CSS vars back to what's actually applied, not left on a
  // skin the user never unlocked.
  const activeSkinRef = useRef(s.skin ?? DEFAULT_SKIN_ID)
  useEffect(() => { activeSkinRef.current = s.skin ?? DEFAULT_SKIN_ID }, [s.skin])
  useEffect(() => () => applySkin(activeSkinRef.current), [])

  const handleRedeem = async () => {
    setRedeeming(true)
    setRedeemError(null)
    setRedeemSuccess(null)
    try {
      const unlocked = await redeemSkinCode(redeemInput)
      // Applied straight to the saved project, not just the local draft here — a
      // redeemed code is already consumed server-side the moment this resolves, so
      // if the unlock only lived in draft state until "Save" was clicked, closing
      // the modal without saving would burn the code with nothing to show for it.
      onUnlockSkins(unlocked)
      setS(prev => ({ ...prev, ownedSkins: Array.from(new Set([...(prev.ownedSkins ?? []), ...unlocked])) }))
      setRedeemSuccess(unlocked.length > 1 ? `Unlocked all ${unlocked.length} skins — thank you!` : `Unlocked ${SKINS[unlocked[0]]?.name ?? 'your skin'} — thank you!`)
      setRedeemInput('')
    } catch (e) {
      setRedeemError(e instanceof Error ? e.message : 'Could not redeem that code.')
    } finally {
      setRedeeming(false)
    }
  }

  const handleBuyBundle = async () => {
    setPurchasing(true)
    setPurchaseError(null)
    try {
      const unlocked = await purchaseBundle(setPurchaseStatus)
      // Same reasoning as handleRedeem above — the purchase is already consumed
      // server-side the moment this resolves, so apply it straight to the saved
      // project rather than leaving it stuck in unsaved draft state.
      onUnlockSkins(unlocked)
      setS(prev => ({ ...prev, ownedSkins: Array.from(new Set([...(prev.ownedSkins ?? []), ...unlocked])) }))
      setRedeemSuccess(`Unlocked all ${unlocked.length} skins — thank you!`)
    } catch (e) {
      setPurchaseError(e instanceof Error ? e.message : 'Could not complete the purchase.')
    } finally {
      setPurchasing(false)
      setPurchaseStatus(null)
    }
  }

  const pickFolder = async () => {
    const chosen = await open({ directory: true, title: 'Choose save folder' }).catch(() => null)
    if (chosen && !Array.isArray(chosen)) setFolder(chosen)
  }

  const resLabel: Record<RecordingSettings['resolution'], string> = {
    '720p': '720p — 1280×720',
    '1080p': '1080p — 1920×1080',
    '1440p': '1440p — 2560×1440',
  }

  return (
    <div className="modal-backdrop">
      <div className="modal-shell w-[420px] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center px-5 py-4 border-b border-black/[0.08] dark:border-panel-glow">
          <span className="text-gray-900 dark:text-white font-semibold text-sm flex-1">Settings</span>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors text-lg leading-none">×</button>
        </div>

        <div className="p-5 flex flex-col gap-3 max-h-[70vh] overflow-y-auto">

          {/* Resolution + Frame Rate */}
          <div className="card-panel p-3.5 flex flex-col gap-4">
            <div>
              <label className="section-label mb-2 block">Resolution</label>
              <div className="pill-group w-full">
                {(['720p', '1080p', '1440p'] as const).map(r => (
                  <button
                    key={r}
                    onClick={() => setS(prev => ({ ...prev, resolution: r }))}
                    className={`pill flex-1 justify-center py-2 ${s.resolution === r ? 'pill-active' : ''}`}
                  >
                    {r}
                  </button>
                ))}
              </div>
              <p className="text-gray-400 dark:text-gray-600 text-xs mt-1.5">{resLabel[s.resolution]}</p>
            </div>

            <div>
              <label className="section-label mb-2 block">Frame Rate</label>
              <div className="pill-group w-full">
                {([30, 60] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setS(prev => ({ ...prev, fps: f }))}
                    className={`pill flex-1 justify-center py-2 ${s.fps === f ? 'pill-active' : ''}`}
                  >
                    {f} fps
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Bitrate */}
          <div className="card-panel p-3.5">
            <label className="section-label mb-2 block">Video Quality</label>
            <div className="pill-group w-full">
              {([
                { value: 4,  label: 'Good',   sub: '4 Mbps' },
                { value: 6,  label: 'Twitch',  sub: '6 Mbps' },
                { value: 8,  label: 'Great',   sub: '8 Mbps' },
                { value: 16, label: 'Ultra',   sub: '16 Mbps' },
              ] as const).map(({ value, label, sub }) => (
                <button
                  key={value}
                  onClick={() => setS(prev => ({ ...prev, bitrate: value }))}
                  className={`pill flex-1 py-2 flex flex-col items-center gap-0.5 ${s.bitrate === value ? 'pill-active' : ''}`}
                >
                  <span>{label}</span>
                  <span className={`text-xs font-normal ${s.bitrate === value ? 'text-white/70 dark:text-gray-900/60' : 'text-gray-400 dark:text-gray-600'}`}>{sub}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-600 mt-1.5">Twitch max 6 Mbps · YouTube up to 9 Mbps</p>
          </div>

          {/* Skins */}
          <div className="card-panel p-3.5">
            <label className="section-label mb-2 block">Skin</label>
            <div className="grid grid-cols-4 gap-1.5">
              {Object.values(SKINS).map(skin => {
                const owned = isSkinOwned(skin, s.ownedSkins ?? [])
                const active = s.skin === skin.id
                return (
                  <Tooltip key={skin.id} text={owned ? skin.name : `${skin.name} — hover to preview. Click to unlock the bundle (${BUNDLE_PRICE}, all 13 premium skins).`} position="top">
                    <button
                      onClick={() => { if (owned) { onChangeSkin(skin.id); setS(prev => ({ ...prev, skin: skin.id })) } else if (!purchasing) { handleBuyBundle() } }}
                      onMouseEnter={() => { if (!owned) applySkin(skin.id) }}
                      onMouseLeave={() => { if (!owned) applySkin(activeSkinRef.current) }}
                      className={`w-full flex flex-col items-center gap-1.5 py-2 rounded-lg transition-colors ${active ? 'bg-surface-card dark:bg-surface-dark-card' : 'hover:bg-surface-card dark:hover:bg-surface-dark-card'} ${!owned ? 'cursor-pointer' : ''}`}
                    >
                      <span
                        className="relative w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: skin.gradient ?? `rgb(${skin.accent})`, opacity: owned ? 1 : 0.45 }}
                      >
                        {active && (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={`rgb(${skin.fg})`} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        )}
                        {!owned && (
                          <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-surface-card dark:bg-surface-dark-card border border-black/[0.08] dark:border-panel-glow flex items-center justify-center">
                            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-text-secondary dark:text-text-dark-secondary">
                              <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                            </svg>
                          </span>
                        )}
                      </span>
                      <span
                        className={`text-[10px] font-medium truncate w-full text-center ${skin.id === 'midnight-skies' ? '' : 'text-gray-700 dark:text-gray-300'}`}
                        style={skin.id === 'midnight-skies' ? { color: '#FFEAA7' } : undefined}
                      >{skin.name.replace('Slate ', '')}</span>
                      {skin.premium ? (
                        <span className="text-[9px] text-text-secondary dark:text-text-dark-secondary">{owned ? 'Owned' : 'Locked'}</span>
                      ) : skin.id === DEFAULT_SKIN_ID ? (
                        <span className="text-[9px] text-text-secondary dark:text-text-dark-secondary">Default</span>
                      ) : null}
                    </button>
                  </Tooltip>
                )
              })}
            </div>

            <div className="mt-3 pt-3 border-t border-black/[0.08] dark:border-panel-glow flex flex-col gap-2">
              <p className="text-xs text-gray-400 dark:text-gray-600">
                Cosmetic only — Slate's core features are always free. One purchase unlocks all 13 premium skins, forever.
              </p>
              <button
                onClick={handleBuyBundle}
                disabled={purchasing}
                className="btn-primary w-full py-2 text-xs disabled:opacity-60 disabled:cursor-wait"
              >
                {purchasing
                  ? (purchaseStatus === 'creating-order' ? 'Starting checkout…' : purchaseStatus === 'awaiting-payment' ? 'Waiting for payment in your browser…' : 'Unlocking…')
                  : `Unlock all skins — ${BUNDLE_PRICE}`}
              </button>
              {purchaseError && <p className="text-xs text-red-500 dark:text-red-400">{purchaseError}</p>}

              <button
                onClick={() => setShowRedeemInput(v => !v)}
                className="text-xs text-text-secondary dark:text-text-dark-secondary hover:text-gray-900 dark:hover:text-white text-left transition-colors"
              >
                {showRedeemInput ? 'Hide code redemption' : 'Already have a code?'}
              </button>
              {showRedeemInput && (
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={redeemInput}
                    onChange={e => { setRedeemInput(e.target.value); setRedeemError(null); setRedeemSuccess(null) }}
                    onKeyDown={e => { if (e.key === 'Enter' && redeemInput.trim() && !redeeming) handleRedeem() }}
                    placeholder="SKIN-XXXX-XXXX"
                    className="flex-1 text-xs px-2.5 py-2 rounded-lg bg-surface-card dark:bg-surface-dark-card text-gray-800 dark:text-white outline-none border border-black/[0.08] dark:border-panel-glow focus:border-brand-red placeholder-gray-400 dark:placeholder-gray-600"
                  />
                  <button
                    onClick={handleRedeem}
                    disabled={!redeemInput.trim() || redeeming}
                    className="btn-solid px-3 py-2 text-xs disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {redeeming ? 'Checking…' : 'Redeem'}
                  </button>
                </div>
              )}
              {redeemError && <p className="text-xs text-red-500 dark:text-red-400">{redeemError}</p>}
              {redeemSuccess && <p className="text-xs text-brand-red font-semibold">{redeemSuccess}</p>}
            </div>
          </div>

          {/* Save folder */}
          <div className="card-panel p-3.5">
            <label className="section-label mb-2 block">Save Recordings To</label>
            <div className="flex items-center gap-2">
              <span className="flex-1 text-xs text-gray-500 dark:text-gray-400 bg-surface-card dark:bg-surface-dark-card rounded-lg px-3 py-2 truncate">{folder || 'Documents/Slate Recordings'}</span>
              <button
                onClick={pickFolder}
                className="px-3 py-2 bg-surface-card hover:bg-surface-card-hover dark:bg-surface-dark-card dark:hover:bg-surface-dark-card-hover text-gray-800 dark:text-white text-xs font-semibold rounded-lg transition-colors flex-shrink-0"
              >
                Browse
              </button>
            </div>
          </div>

          {/* Show tooltips */}
          <div className="card-panel p-3.5 flex items-center justify-between">
            <div>
              <p className="section-label">Show Tips</p>
              <p className="text-xs text-gray-400 dark:text-gray-600 mt-0.5">Helpful hints on hover for new users</p>
            </div>
            <button
              onClick={() => setS(prev => ({ ...prev, showTooltips: !prev.showTooltips }))}
              className={`w-10 h-5 rounded-full transition-colors flex items-center px-0.5 flex-shrink-0 ${s.showTooltips ? 'bg-brand-red justify-end' : 'bg-gray-300 dark:bg-gray-700 justify-start'}`}
            >
              <div className="w-4 h-4 bg-white rounded-full shadow" />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 px-5 py-4 border-t border-black/[0.08] dark:border-panel-glow">
          <button
            onClick={() => { onRestoreScenes(); onClose() }}
            className="w-8 h-8 flex-shrink-0 flex items-center justify-center bg-surface-card hover:bg-surface-card-hover dark:bg-surface-dark-card dark:hover:bg-surface-dark-card-hover text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-lg transition-colors"
            title="Restore default scenes — adds Starting Soon, Sub Goal, New Sub, Raid, and End Screen scenes if you don't have them"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.95"/>
            </svg>
          </button>
          <div className="flex-1" />
          <button onClick={onClose} className="btn-secondary px-4 py-2 text-xs font-semibold">
            Cancel
          </button>
          <button
            onClick={() => { onSave(s, folder); onClose() }}
            className="btn-primary px-4 py-2 text-xs"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
