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
  build: () => Omit<Scene, 'id'>
}

export const overlayTemplates: OverlayTemplate[] = [
  {
    id: 'gaming',
    label: 'Gaming',
    description: 'Full-screen game capture + small cam in the corner',
    icon: '🎮',
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
]
