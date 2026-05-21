import { Scene, Source } from '../store'

function src(overrides: Partial<Source> & Pick<Source, 'type' | 'name'>): Source {
  return {
    id: `src-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    visible: true,
    x: 0, y: 0, width: 0, height: 0,
    ...overrides,
  }
}

export interface OverlayTemplate {
  id: string
  label: string
  description: string
  icon: string
  category: 'general' | 'affiliate'
  build: () => Omit<Scene, 'id'>
}

export const overlayTemplates: OverlayTemplate[] = [
  // ── General ──────────────────────────────────────────────────────────────────
  {
    id: 'gaming',
    label: 'Gaming',
    description: 'Full-screen game capture + small cam in the corner',
    icon: '🎮',
    category: 'general',
    build: () => ({
      name: 'Gaming',
      sources: [
        src({ type: 'screen', name: 'Game capture', x: 0, y: 0, width: 640, height: 360 }),
        src({ type: 'avatar', name: 'Webcam', x: 500, y: 260, width: 130, height: 130 }),
      ],
    }),
  },
  {
    id: 'just-chatting',
    label: 'Just Chatting',
    description: 'Large webcam with a lower-third name banner',
    icon: '💬',
    category: 'general',
    build: () => ({
      name: 'Just Chatting',
      sources: [
        src({ type: 'camera', name: 'Webcam', x: 120, y: 30, width: 400, height: 225 }),
        src({
          type: 'text', name: 'Name banner', x: 0, y: 310, width: 640, height: 40,
          text: 'Your Name · Just Chatting', scrolling: false, anchor: 'bottom',
        }),
      ],
    }),
  },
  {
    id: 'lower-third',
    label: 'Lower Third',
    description: 'Screen share with a name/info bar at the bottom',
    icon: '📺',
    category: 'general',
    build: () => ({
      name: 'Lower Third',
      sources: [
        src({ type: 'screen', name: 'Screen', x: 0, y: 0, width: 640, height: 340 }),
        src({
          type: 'text', name: 'Lower third', x: 0, y: 330, width: 640, height: 40,
          text: 'Your Name  |  Topic goes here', scrolling: false, anchor: 'bottom',
        }),
      ],
    }),
  },
  {
    id: 'brb',
    label: 'BRB',
    description: 'Be Right Back screen with scrolling message',
    icon: '⏸️',
    category: 'general',
    build: () => ({
      name: 'BRB',
      sources: [
        src({
          type: 'text', name: 'BRB message', x: 0, y: 140, width: 640, height: 60,
          text: '  Be Right Back!  •  Be Right Back!  •', scrolling: true, anchor: 'free',
        }),
        src({
          type: 'text', name: 'Sub info', x: 0, y: 330, width: 640, height: 36,
          text: 'Follow & subscribe so you don\'t miss anything!', scrolling: false, anchor: 'bottom',
        }),
      ],
    }),
  },
  {
    id: 'starting-soon',
    label: 'Starting Soon',
    description: 'Countdown / starting soon screen',
    icon: '🔴',
    category: 'general',
    build: () => ({
      name: 'Starting Soon',
      sources: [
        src({
          type: 'text', name: 'Starting label', x: 0, y: 130, width: 640, height: 60,
          text: 'Stream Starting Soon!', scrolling: false, anchor: 'free',
        }),
        src({
          type: 'text', name: 'Social scroll', x: 0, y: 320, width: 640, height: 36,
          text: '  Follow on Twitch  •  Join Discord  •  Subscribe on YouTube  •',
          scrolling: true, anchor: 'bottom',
        }),
      ],
    }),
  },

  // ── Twitch Affiliate ─────────────────────────────────────────────────────────
  {
    id: 'affiliate-sub-goal',
    label: 'Sub Goal',
    description: 'Game capture with a subscriber goal banner at the bottom',
    icon: '⭐',
    category: 'affiliate',
    build: () => ({
      name: 'Sub Goal',
      background: { type: 'color', color: '#0d0d13' },
      sources: [
        src({ type: 'screen', name: 'Game', x: 0, y: 0, width: 640, height: 320 }),
        src({ type: 'avatar', name: 'Cam', x: 490, y: 220, width: 140, height: 140 }),
        src({
          type: 'text', name: 'Sub goal', x: 0, y: 318, width: 640, height: 42,
          text: '  ⭐ Sub Goal: 0 / 50  —  Help us reach the goal!  ⭐', scrolling: true, anchor: 'bottom',
        }),
      ],
    }),
  },
  {
    id: 'affiliate-new-sub',
    label: 'New Sub',
    description: 'Switch to this scene when someone subscribes to hype the moment',
    icon: '🎉',
    category: 'affiliate',
    build: () => ({
      name: 'New Sub!',
      background: { type: 'color', color: '#0d0d13' },
      sources: [
        src({
          type: 'text', name: 'Hype banner', x: 0, y: 100, width: 640, height: 70,
          text: '  🎉 NEW SUBSCRIBER!  🎉  THANK YOU!  🎉  NEW SUBSCRIBER!  🎉',
          scrolling: true, anchor: 'free',
        }),
        src({ type: 'camera', name: 'Reaction cam', x: 160, y: 180, width: 320, height: 180 }),
        src({
          type: 'text', name: 'Thank you', x: 0, y: 330, width: 640, height: 36,
          text: 'Welcome to the squad! You\'re now part of the community!', scrolling: false, anchor: 'bottom',
        }),
      ],
    }),
  },
  {
    id: 'affiliate-raid',
    label: 'Raid Welcome',
    description: 'Switch to this when your channel is being raided',
    icon: '⚔️',
    category: 'affiliate',
    build: () => ({
      name: 'Raid!',
      background: { type: 'color', color: '#0d0d13' },
      sources: [
        src({
          type: 'text', name: 'Raid banner', x: 0, y: 100, width: 640, height: 70,
          text: '  ⚔️  RAID INCOMING!  ⚔️  WELCOME RAIDERS!  ⚔️  RAID INCOMING!  ⚔️',
          scrolling: true, anchor: 'free',
        }),
        src({ type: 'camera', name: 'Cam', x: 200, y: 185, width: 240, height: 135 }),
        src({
          type: 'text', name: 'Welcome msg', x: 0, y: 330, width: 640, height: 36,
          text: 'Welcome to the stream! Drop a follow so you never miss a stream!',
          scrolling: false, anchor: 'bottom',
        }),
      ],
    }),
  },
  {
    id: 'affiliate-end',
    label: 'End Screen',
    description: 'Wrap-up scene with a follow/sub call-to-action',
    icon: '👋',
    category: 'affiliate',
    build: () => ({
      name: 'End Screen',
      background: { type: 'color', color: '#0d0d13' },
      sources: [
        src({
          type: 'text', name: 'Thanks', x: 0, y: 120, width: 640, height: 70,
          text: 'Thanks for watching!', scrolling: false, anchor: 'free',
        }),
        src({
          type: 'text', name: 'CTA scroll', x: 0, y: 310, width: 640, height: 36,
          text: '  👋 Thanks for watching!  •  Drop a follow!  •  Subscribe to support!  •  See you next time!  •',
          scrolling: true, anchor: 'bottom',
        }),
      ],
    }),
  },
]
