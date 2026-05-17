// Slate — streaming platform credentials
// Client IDs are baked in at build time from .env — no secrets are stored.
// YouTube uses PKCE (RFC 7636) so no client_secret is ever needed or embedded.

export const TWITCH_CLIENT_ID = (import.meta.env.VITE_TWITCH_CLIENT_ID ?? '') as string
export const YOUTUBE_CLIENT_ID = (import.meta.env.VITE_YOUTUBE_CLIENT_ID ?? '') as string

/** Generate a PKCE code_verifier + code_challenge pair using the Web Crypto API. */
export async function generatePkce(): Promise<{ codeVerifier: string; codeChallenge: string }> {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  const codeVerifier = base64url(array)

  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(codeVerifier))
  const codeChallenge = base64url(new Uint8Array(digest))

  return { codeVerifier, codeChallenge }
}

function base64url(bytes: Uint8Array): string {
  let b64 = ''
  for (let i = 0; i < bytes.length; i += 8192) {
    b64 += String.fromCharCode(...bytes.subarray(i, i + 8192))
  }
  return btoa(b64).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}
