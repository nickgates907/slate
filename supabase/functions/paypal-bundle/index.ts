// Supabase Edge Function: automated PayPal purchase for the "unlock all skins"
// bundle ($9.99). Two routes, picked by the trailing path segment:
//
//   POST .../paypal-bundle/create-order
//     Called by the app when the user clicks "Unlock all skins". Creates a
//     PayPal order for a fixed $9.99 and returns { token, approvalUrl }. The
//     token is a random reference (same SKIN-XXXX-XXXX-shaped alphabet as
//     manually-issued codes) embedded as the PayPal order's custom_id — it is
//     NOT written to skin_codes yet. Until payment is actually captured there
//     is nothing in the database for this token, so there's nothing a client
//     could redeem early.
//
//   POST .../paypal-bundle/webhook
//     Configured in the PayPal Developer dashboard to receive
//     PAYMENT.CAPTURE.COMPLETED events. Verifies the event is genuinely from
//     PayPal (not just a request shaped like one), checks the captured amount
//     matches $9.99 USD, then inserts the token into skin_codes with
//     skin_id='bundle', redeemed=false — using the service-role key, which
//     bypasses the anon-key RLS policies entirely. This is the ONLY place a
//     skin_codes row for a bundle purchase gets created. The existing
//     redeemSkinCode() flow in the app (unchanged) picks it up from there.
//
// Required secrets (`supabase secrets set NAME=value`):
//   PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, PAYPAL_WEBHOOK_ID
//   PAYPAL_API_BASE  — https://api-m.paypal.com (live) or
//                      https://api-m.sandbox.paypal.com (testing)
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected automatically by
// Supabase into every Edge Function — no need to set those manually.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// The app runs inside a Tauri webview, which (unlike a plain Node/curl fetch
// used to test this function directly) enforces CORS — without these headers
// every response gets silently turned into a "Failed to fetch" in the app
// even though the function itself ran fine and returned 200.
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  })
}

const PAYPAL_API_BASE = Deno.env.get('PAYPAL_API_BASE') ?? 'https://api-m.paypal.com'
const PAYPAL_CLIENT_ID = Deno.env.get('PAYPAL_CLIENT_ID') ?? ''
const PAYPAL_CLIENT_SECRET = Deno.env.get('PAYPAL_CLIENT_SECRET') ?? ''
const PAYPAL_WEBHOOK_ID = Deno.env.get('PAYPAL_WEBHOOK_ID') ?? ''
const BUNDLE_PRICE_USD = '9.99'

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // avoids 0/O, 1/I/L
function randomToken(): string {
  const group = (len: number) => Array.from({ length: len }, () => CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]).join('')
  // Matches the exact SKIN-XXXX-XXXX shape the app's existing redeemSkinCode()
  // already validates — once the webhook below writes this token into
  // skin_codes, the app's current redemption code handles it unchanged.
  return `SKIN-${group(4)}-${group(4)}`
}

async function paypalAccessToken(): Promise<string> {
  const res = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${btoa(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`)}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })
  if (!res.ok) throw new Error(`PayPal auth failed: ${res.status}`)
  const data = await res.json()
  return data.access_token
}

async function handleCreateOrder(req: Request): Promise<Response> {
  const token = randomToken()
  const accessToken = await paypalAccessToken()

  const orderRes = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [{
        custom_id: token,
        description: 'Slate — Unlock all skins (bundle)',
        amount: { currency_code: 'USD', value: BUNDLE_PRICE_USD },
      }],
      application_context: {
        brand_name: 'Slate',
        shipping_preference: 'NO_SHIPPING',
        user_action: 'PAY_NOW',
        return_url: 'https://www.paypal.com', // unused by the app — it polls instead of relying on this redirect
        cancel_url: 'https://www.paypal.com',
      },
    }),
  })
  if (!orderRes.ok) {
    const body = await orderRes.text().catch(() => '')
    return json({ error: `Could not create PayPal order (${orderRes.status}): ${body}` }, 502)
  }
  const order = await orderRes.json()
  const approvalUrl = (order.links ?? []).find((l: { rel: string; href: string }) => l.rel === 'approve')?.href
  if (!approvalUrl) {
    return json({ error: 'PayPal order created but had no approval link' }, 502)
  }

  return json({ token, approvalUrl })
}

async function verifyWebhookSignature(req: Request, rawBody: string): Promise<boolean> {
  const accessToken = await paypalAccessToken()
  const verifyRes = await fetch(`${PAYPAL_API_BASE}/v1/notifications/verify-webhook-signature`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      auth_algo: req.headers.get('paypal-auth-algo'),
      cert_url: req.headers.get('paypal-cert-url'),
      transmission_id: req.headers.get('paypal-transmission-id'),
      transmission_sig: req.headers.get('paypal-transmission-sig'),
      transmission_time: req.headers.get('paypal-transmission-time'),
      webhook_id: PAYPAL_WEBHOOK_ID,
      webhook_event: JSON.parse(rawBody),
    }),
  })
  if (!verifyRes.ok) return false
  const result = await verifyRes.json()
  return result.verification_status === 'SUCCESS'
}

async function handleWebhook(req: Request): Promise<Response> {
  const rawBody = await req.text()

  const verified = await verifyWebhookSignature(req, rawBody).catch(() => false)
  if (!verified) {
    return json({ error: 'Webhook signature verification failed' }, 401)
  }

  const event = JSON.parse(rawBody)
  if (event.event_type !== 'PAYMENT.CAPTURE.COMPLETED') {
    // Not an event we act on (e.g. a refund, a denial) — acknowledge so PayPal stops retrying.
    return json({ ok: true, ignored: event.event_type })
  }

  const resource = event.resource ?? {}
  const token: string | undefined = resource.custom_id
  const amount = resource.amount ?? {}
  if (!token || amount.currency_code !== 'USD' || parseFloat(amount.value) < parseFloat(BUNDLE_PRICE_USD)) {
    return json({ error: 'Payment did not match the expected bundle amount' }, 400)
  }

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const { error } = await supabase.from('skin_codes').insert({ code: token, skin_id: 'bundle', redeemed: false })
  // A duplicate webhook delivery for the same payment re-inserts the same token —
  // treat a primary-key conflict as success rather than an error.
  if (error && error.code !== '23505') {
    return json({ error: error.message }, 500)
  }

  return json({ ok: true })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS_HEADERS })
  const path = new URL(req.url).pathname
  try {
    if (req.method === 'POST' && path.endsWith('/create-order')) return await handleCreateOrder(req)
    if (req.method === 'POST' && path.endsWith('/webhook')) return await handleWebhook(req)
    return json({ error: 'Not found' }, 404)
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500)
  }
})
