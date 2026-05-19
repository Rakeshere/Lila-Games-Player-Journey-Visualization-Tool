export const EVENT_COLORS: Record<string, string> = {
  Kill: '#22c55e',
  BotKill: '#4ade80',
  Killed: '#ef4444',
  BotKilled: '#f87171',
  KilledByStorm: '#a855f7',
  Loot: '#fbbf24',
}

export function eventCategory(event: string): 'kill' | 'death' | 'loot' | 'storm' | 'other' {
  if (event === 'Kill' || event === 'BotKill') return 'kill'
  if (event === 'Killed' || event === 'BotKilled') return 'death'
  if (event === 'KilledByStorm') return 'storm'
  if (event === 'Loot') return 'loot'
  return 'other'
}

export function drawEventMarker(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  event: string,
  scale: number,
) {
  const cat = eventCategory(event)
  const r = 5 * scale
  ctx.save()
  ctx.translate(x, y)

  if (cat === 'kill') {
    ctx.fillStyle = EVENT_COLORS[event] ?? '#22c55e'
    ctx.beginPath()
    ctx.moveTo(0, -r)
    ctx.lineTo(r, r)
    ctx.lineTo(-r, r)
    ctx.closePath()
    ctx.fill()
  } else if (cat === 'death') {
    ctx.strokeStyle = EVENT_COLORS[event] ?? '#ef4444'
    ctx.lineWidth = 2 * scale
    ctx.beginPath()
    ctx.moveTo(-r, -r)
    ctx.lineTo(r, r)
    ctx.moveTo(r, -r)
    ctx.lineTo(-r, r)
    ctx.stroke()
  } else if (cat === 'storm') {
    ctx.fillStyle = EVENT_COLORS.KilledByStorm
    ctx.beginPath()
    ctx.arc(0, 0, r, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#1e1b4b'
    ctx.font = `${8 * scale}px sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('⚡', 0, 1)
  } else if (cat === 'loot') {
    ctx.fillStyle = EVENT_COLORS.Loot
    ctx.strokeStyle = '#78350f'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.rect(-r, -r, r * 2, r * 2)
    ctx.fill()
    ctx.stroke()
  }

  ctx.restore()
}
