import { PREMIUM_SKIN_IDS, BUNDLE_CODE_ID } from './skins'

// Same Supabase REST pattern as layoutShare.ts/crashReporter.ts — raw fetch(),
// not the SDK, to keep the bundle small. Codes are generated manually (not by
// this app) after a donation and sent to the supporter by hand; this function
// just validates + redeems one against the skin_codes table.
const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string) ?? ''
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) ?? ''
const SUPABASE_HEADERS = {
  'Content-Type': 'application/json',
  'apikey': SUPABASE_ANON_KEY,
  'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
}

const CODE_RE = /^SKIN-[A-Z0-9]{4}-[A-Z0-9]{4}$/i

/** Redeems a skin unlock code. Returns the skin id(s) newly unlocked (a bundle code unlocks all premium skins at once). Throws with a user-facing message on failure. */
export async function redeemSkinCode(rawCode: string): Promise<string[]> {
  const code = rawCode.trim().toUpperCase()
  if (!CODE_RE.test(code)) {
    throw new Error('That doesn\'t look like a valid skin code — it should look like SKIN-XXXX-XXXX.')
  }

  const lookupRes = await fetch(
    `${SUPABASE_URL}/rest/v1/skin_codes?code=eq.${encodeURIComponent(code)}&select=code,skin_id,redeemed`,
    { headers: SUPABASE_HEADERS },
  )
  if (!lookupRes.ok) throw new Error('Could not reach the server to check your code — check your internet connection.')
  const rows = await lookupRes.json().catch(() => null)
  if (!Array.isArray(rows) || rows.length === 0) throw new Error('That code wasn\'t found. Double-check it and try again.')
  const row = rows[0]
  if (row.redeemed) throw new Error('That code has already been redeemed.')

  // redeemed=eq.false in the filter (not just the earlier read) is what actually prevents
  // two simultaneous redemptions of the same code — the database only lets the UPDATE
  // through for whichever request gets there first. return=representation (not minimal)
  // is required here: without it we'd only know the HTTP call succeeded, not whether it
  // actually matched and flipped a row — a 200 with zero rows updated looks identical to
  // a 200 with one row updated unless we check the body.
  const updateRes = await fetch(
    `${SUPABASE_URL}/rest/v1/skin_codes?code=eq.${encodeURIComponent(code)}&redeemed=eq.false`,
    { method: 'PATCH', headers: { ...SUPABASE_HEADERS, 'Prefer': 'return=representation' }, body: JSON.stringify({ redeemed: true }) },
  )
  if (!updateRes.ok) throw new Error('Could not redeem your code — please try again in a moment.')
  const updatedRows = await updateRes.json().catch(() => null)
  if (!Array.isArray(updatedRows) || updatedRows.length === 0) {
    throw new Error('That code was just redeemed (possibly by someone else) — it can only be used once.')
  }

  return row.skin_id === BUNDLE_CODE_ID ? PREMIUM_SKIN_IDS : [row.skin_id]
}
