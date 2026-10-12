import { open as openUrl } from '@tauri-apps/api/shell'
import { redeemSkinCode } from './skinCodes'

// Automated "unlock all skins" purchase, backed by the paypal-bundle Supabase
// Edge Function (supabase/functions/paypal-bundle). The function creates a
// PayPal order and hands back a one-time reference token in the same
// SKIN-XXXX-XXXX shape as a manually-issued code; this app opens PayPal's
// checkout for the user, then polls skin_codes for that token to appear —
// which only happens once PayPal's webhook confirms the payment actually
// captured — and redeems it the moment it does, through the existing
// redeemSkinCode() flow (unchanged). The token is never trusted or redeemed
// before the row exists, so there's no way to unlock without really paying.
const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string) ?? ''
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) ?? ''
const SUPABASE_HEADERS = {
  'Content-Type': 'application/json',
  'apikey': SUPABASE_ANON_KEY,
  'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
}

const POLL_INTERVAL_MS = 3000
const POLL_TIMEOUT_MS = 10 * 60 * 1000 // 10 minutes — plenty of time to complete a PayPal checkout

export type BundlePurchaseStatus = 'creating-order' | 'awaiting-payment' | 'redeeming'

async function createOrder(): Promise<{ token: string; approvalUrl: string }> {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/paypal-bundle/create-order`, {
    method: 'POST',
    headers: SUPABASE_HEADERS,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.error || `Could not start checkout (${res.status}) — please try again.`)
  }
  return res.json()
}

async function codeExists(token: string): Promise<boolean> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/skin_codes?code=eq.${encodeURIComponent(token)}&select=code`,
    { headers: SUPABASE_HEADERS },
  )
  if (!res.ok) return false
  const rows = await res.json().catch(() => null)
  return Array.isArray(rows) && rows.length > 0
}

/** Runs the full purchase flow. Returns the newly-unlocked skin ids on success. Throws a user-facing message on failure or if the user doesn't complete payment within the timeout. */
export async function purchaseBundle(onStatus?: (status: BundlePurchaseStatus) => void): Promise<string[]> {
  onStatus?.('creating-order')
  const { token, approvalUrl } = await createOrder()

  await openUrl(approvalUrl)

  onStatus?.('awaiting-payment')
  const deadline = Date.now() + POLL_TIMEOUT_MS
  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, POLL_INTERVAL_MS))
    if (await codeExists(token)) {
      onStatus?.('redeeming')
      return redeemSkinCode(token)
    }
  }
  throw new Error('Didn\'t see a completed payment yet. If you finished checking out in the browser, try "Already have a code?" below with the same purchase — it may just need a minute to confirm.')
}
