import { useRef, useCallback, useState } from 'react'

export interface ChatMessage {
  id: string
  username: string
  color: string
  text: string
  ts: number
}

const MAX_MESSAGES = 50
const DEFAULT_COLORS = ['#FF4D4D','#FF6B6B','#FFA94D','#69DB7C','#4DABF7','#da77f2','#f783ac']

function hashColor(name: string): string {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0
  return DEFAULT_COLORS[Math.abs(h) % DEFAULT_COLORS.length]
}

export function useChat() {
  const wsRef    = useRef<WebSocket | null>(null)
  const activeRef = useRef(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])

  const connect = useCallback((token: string, channel: string) => {
    if (wsRef.current) return
    activeRef.current = true

    const ws = new WebSocket('wss://irc-ws.chat.twitch.tv:443')
    wsRef.current = ws

    ws.onopen = () => {
      ws.send(`PASS oauth:${token}`)
      ws.send(`NICK justinfan${Math.floor(Math.random() * 80000 + 1000)}`) // anonymous if no real nick needed
      ws.send('CAP REQ :twitch.tv/tags twitch.tv/commands')
      ws.send(`JOIN #${channel.toLowerCase()}`)
    }

    ws.onmessage = (e) => {
      const raw = e.data as string

      // Respond to PING
      if (raw.startsWith('PING')) { ws.send('PONG :tmi.twitch.tv'); return }

      // Parse PRIVMSG lines
      // Format: @tags :user!user@user.tmi.twitch.tv PRIVMSG #channel :message
      const lines = raw.split('\r\n').filter(Boolean)
      const newMsgs: ChatMessage[] = []

      for (const line of lines) {
        if (!line.includes('PRIVMSG')) continue

        // Extract tags
        let color = ''
        let displayName = ''
        if (line.startsWith('@')) {
          const tagStr = line.slice(1, line.indexOf(' '))
          for (const tag of tagStr.split(';')) {
            const [k, v] = tag.split('=')
            if (k === 'color' && v) color = v
            if (k === 'display-name' && v) displayName = v
          }
        }

        // Extract username from prefix if display-name missing
        const prefixMatch = line.match(/:(\w+)!\w+@\w+\.tmi\.twitch\.tv PRIVMSG/)
        const username = displayName || prefixMatch?.[1] || 'viewer'

        // Extract message text
        const msgMatch = line.match(/PRIVMSG #\S+ :(.+)$/)
        if (!msgMatch) continue
        const text = msgMatch[1].trimEnd()

        newMsgs.push({
          id: `${Date.now()}-${Math.random()}`,
          username,
          color: color || hashColor(username),
          text,
          ts: Date.now(),
        })
      }

      if (newMsgs.length === 0) return
      setMessages(prev => [...prev, ...newMsgs].slice(-MAX_MESSAGES))
    }

    ws.onclose = () => {
      wsRef.current = null
      if (activeRef.current) {
        setTimeout(() => { if (activeRef.current) connect(token, channel) }, 4000)
      }
    }
  }, [])

  const disconnect = useCallback(() => {
    activeRef.current = false
    wsRef.current?.close()
    wsRef.current = null
    setMessages([])
  }, [])

  return { messages, connect, disconnect }
}
