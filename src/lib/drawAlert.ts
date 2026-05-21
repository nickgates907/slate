import { ActiveAlert } from '../hooks/useAlerts'

export function drawAlert(ctx: CanvasRenderingContext2D, alert: ActiveAlert, outW: number, outH: number) {
  const elapsed = performance.now() - alert.startedAt
  const progress = Math.min(elapsed / alert.duration, 1)
  const scale = outH / 720

  let opacity = 1
  let slideY = 0
  if (progress < 0.12) {
    const t = progress / 0.12
    opacity = t; slideY = (1 - t) * -60 * scale
  } else if (progress > 0.85) {
    const t = (progress - 0.85) / 0.15
    opacity = 1 - t; slideY = t * -60 * scale
  }

  const cardW = 320 * (outW / 1280)
  const cardH = 64 * scale
  const r = 10 * scale
  const x = (outW - cardW) / 2
  const y = 18 * scale + slideY

  ctx.save()
  ctx.globalAlpha = opacity

  ctx.fillStyle = 'rgba(14,14,26,0.93)'
  ctx.beginPath()
  ctx.roundRect(x, y, cardW, cardH, r)
  ctx.fill()

  const grad = ctx.createLinearGradient(x, y, x + cardW, y)
  grad.addColorStop(0, '#7c3aed')
  grad.addColorStop(1, '#db2777')
  ctx.strokeStyle = grad
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.roundRect(x, y, cardW, cardH, r)
  ctx.stroke()

  ctx.fillStyle = '#7c3aed'
  ctx.beginPath()
  ctx.roundRect(x, y, 4 * scale, cardH, [r, 0, 0, r])
  ctx.fill()

  const labels: Record<string, string> = {
    follow:    `${alert.event.username} followed!`,
    subscribe: `${alert.event.username} subscribed!`,
    gift_sub:  `${alert.event.username} gifted ${alert.event.amount ?? ''} subs!`,
    cheer:     `${alert.event.username} cheered ${alert.event.amount ?? ''} bits!`,
    raid:      `${alert.event.username} raided with ${alert.event.amount ?? ''} viewers!`,
  }
  const subLabels: Record<string, string> = {
    follow: 'New Follower', subscribe: 'New Subscriber', gift_sub: 'Gift Subs',
    cheer: 'Bits Cheer', raid: 'Raid',
  }

  const fs = 12 * scale
  ctx.font = `500 ${fs}px sans-serif`
  ctx.fillStyle = '#a78bfa'
  ctx.fillText(subLabels[alert.event.type] ?? '', x + 14 * scale, y + cardH * 0.38)

  const fs2 = 14 * scale
  ctx.font = `700 ${fs2}px sans-serif`
  ctx.fillStyle = '#ffffff'
  ctx.fillText(labels[alert.event.type] ?? '', x + 14 * scale, y + cardH * 0.72)

  ctx.globalAlpha = 1
  ctx.restore()
}
