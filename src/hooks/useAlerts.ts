import { useRef, useCallback, useState } from 'react'

export type AlertType = 'follow' | 'subscribe' | 'gift_sub' | 'cheer' | 'raid'

export interface AlertEvent {
  type: AlertType
  username: string
  amount?: number // bits cheered / subs gifted / raid viewers
}

export interface ActiveAlert {
  event: AlertEvent
  startedAt: number  // performance.now() timestamp
  duration: number   // ms total display time
}

const ALERT_DURATION = 5000 // ms

export function useAlerts() {
  const wsRef        = useRef<WebSocket | null>(null)
  const alertRef     = useRef<ActiveAlert | null>(null)
  const queueRef     = useRef<AlertEvent[]>([])
  const timerRef     = useRef<ReturnType<typeof setTimeout> | null>(null)
  const activeRef    = useRef(false)
  const [activeAlert, setActiveAlert] = useState<ActiveAlert | null>(null)
  // Called whenever a subscribe or gift_sub event arrives — used to auto-increment sub goal
  const onSubRef = useRef<((type: AlertType, amount?: number) => void) | null>(null)

  const advance = useCallback(() => {
    const next = queueRef.current.shift()
    if (!next) { alertRef.current = null; setActiveAlert(null); return }
    const alert: ActiveAlert = { event: next, startedAt: performance.now(), duration: ALERT_DURATION }
    alertRef.current = alert
    setActiveAlert(alert)
    timerRef.current = setTimeout(advance, ALERT_DURATION)
  }, [])

  const enqueue = useCallback((event: AlertEvent) => {
    queueRef.current.push(event)
    if (event.type === 'subscribe' || event.type === 'gift_sub') {
      onSubRef.current?.(event.type, event.amount)
    }
    if (!alertRef.current) advance()
  }, [advance])

  const connect = useCallback(async (token: string, clientId: string) => {
    if (wsRef.current) return // already connected
    activeRef.current = true

    // Fetch broadcaster ID
    let broadcasterId = ''
    try {
      const r = await fetch('https://api.twitch.tv/helix/users', {
        headers: { Authorization: `Bearer ${token}`, 'Client-Id': clientId },
      })
      const d = await r.json()
      broadcasterId = d.data?.[0]?.id ?? ''
    } catch { return }

    if (!broadcasterId || !activeRef.current) return

    const ws = new WebSocket('wss://eventsub.wss.twitch.tv/ws')
    wsRef.current = ws

    ws.onmessage = async (e) => {
      let msg: Record<string, unknown>
      try { msg = JSON.parse(e.data as string) } catch { return }

      const msgType = (msg.metadata as Record<string, unknown>)?.message_type as string

      if (msgType === 'session_welcome') {
        const sessionId = ((msg.payload as Record<string, unknown>)?.session as Record<string, unknown>)?.id as string
        if (!sessionId) return

        const sub = (type: string, version: string, condition: Record<string, string>) =>
          fetch('https://api.twitch.tv/helix/eventsub/subscriptions', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Client-Id': clientId,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ type, version, condition, transport: { method: 'websocket', session_id: sessionId } }),
          }).catch(() => {/* ignore per-sub failures */})

        await Promise.allSettled([
          sub('channel.follow',            '2', { broadcaster_user_id: broadcasterId, moderator_user_id: broadcasterId }),
          sub('channel.subscribe',         '1', { broadcaster_user_id: broadcasterId }),
          sub('channel.subscription.gift', '1', { broadcaster_user_id: broadcasterId }),
          sub('channel.cheer',             '1', { broadcaster_user_id: broadcasterId }),
          sub('channel.raid',              '1', { to_broadcaster_user_id: broadcasterId }),
        ])
      }

      if (msgType === 'notification') {
        const subType = ((msg.metadata as Record<string, unknown>)?.subscription_type as string) ?? ''
        const ev = (msg.payload as Record<string, unknown>)?.event as Record<string, unknown>
        if (!ev) return

        if (subType === 'channel.follow')
          enqueue({ type: 'follow', username: ev.user_name as string })
        else if (subType === 'channel.subscribe')
          enqueue({ type: 'subscribe', username: ev.user_name as string })
        else if (subType === 'channel.subscription.gift')
          enqueue({ type: 'gift_sub', username: ev.user_name as string, amount: ev.total as number })
        else if (subType === 'channel.cheer')
          enqueue({ type: 'cheer', username: ev.user_name as string, amount: ev.bits as number })
        else if (subType === 'channel.raid')
          enqueue({ type: 'raid', username: ev.from_broadcaster_user_name as string, amount: ev.viewers as number })
      }
    }

    ws.onclose = () => {
      wsRef.current = null
      if (activeRef.current) {
        // Reconnect after 4s
        setTimeout(() => { if (activeRef.current) connect(token, clientId) }, 4000)
      }
    }
  }, [enqueue])

  const disconnect = useCallback(() => {
    activeRef.current = false
    wsRef.current?.close()
    wsRef.current = null
    if (timerRef.current) clearTimeout(timerRef.current)
    alertRef.current = null
    setActiveAlert(null)
    queueRef.current = []
  }, [])

  // Inject a test alert (for preview/debugging)
  const testAlert = useCallback((type: AlertType = 'follow') => {
    enqueue({ type, username: 'TestUser', amount: type === 'cheer' ? 100 : type === 'gift_sub' ? 5 : type === 'raid' ? 42 : undefined })
  }, [enqueue])

  return { connect, disconnect, testAlert, alertRef, activeAlert, onSubRef }
}
