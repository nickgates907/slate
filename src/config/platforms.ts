// Slate — streaming platform credentials
// Client IDs are baked in at build time from .env.
// YouTube uses PKCE (RFC 7636), but Google's token endpoint still requires a
// client_secret on the exchange even for "Desktop app" installed-app clients using
// PKCE, despite older docs suggesting otherwise -- confirmed via a real invalid_request:
// client_secret is missing error. Per Google's own OAuth docs for installed apps, this
// secret "cannot be kept confidential" and isn't treated as one -- embedding it here is
// the expected/normal pattern for this client type, not a security compromise.

export const TWITCH_CLIENT_ID = (import.meta.env.VITE_TWITCH_CLIENT_ID ?? '') as string
export const YOUTUBE_CLIENT_ID = (import.meta.env.VITE_YOUTUBE_CLIENT_ID ?? '') as string
export const YOUTUBE_CLIENT_SECRET = (import.meta.env.VITE_YOUTUBE_CLIENT_SECRET ?? '') as string

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
