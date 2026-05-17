/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_TWITCH_CLIENT_ID: string
  readonly VITE_YOUTUBE_CLIENT_ID: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
