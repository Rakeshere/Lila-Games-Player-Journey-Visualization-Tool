import { useEffect, useRef } from 'react'
import type { HeatmapData, MatchData } from '../types'
import { drawEventMarker } from '../eventStyles'

const SIZE = 1024

interface Props {
  mapImage: string
  match: MatchData | null
  heatmap: HeatmapData | null
  currentTime: number
  showHumans: boolean
  showBots: boolean
  showPaths: boolean
  showEvents: boolean
}

export function MinimapCanvas({
  mapImage,
  match,
  heatmap,
  currentTime,
  showHumans,
  showBots,
  showPaths,
  showEvents,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imgRef = useRef<HTMLImageElement | null>(null)

  useEffect(() => {
    const img = new Image()
    img.src = mapImage
    img.onload = () => {
      imgRef.current = img
      draw()
    }
    return () => {
      imgRef.current = null
    }
  }, [mapImage])

  useEffect(() => {
    draw()
  }, [match, heatmap, currentTime, showHumans, showBots, showPaths, showEvents])

  function draw() {
    const canvas = canvasRef.current
    const img = imgRef.current
    if (!canvas || !img) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const displaySize = canvas.clientWidth
    canvas.width = displaySize * dpr
    canvas.height = displaySize * dpr
    ctx.scale((displaySize * dpr) / SIZE, (displaySize * dpr) / SIZE)

    ctx.clearRect(0, 0, SIZE, SIZE)
    ctx.drawImage(img, 0, 0, SIZE, SIZE)

    if (heatmap?.points.length) {
      const cell = SIZE / heatmap.grid_size
      for (const p of heatmap.points) {
        const alpha = Math.min(0.75, p.intensity * 0.85)
        ctx.fillStyle = `rgba(255, 60, 40, ${alpha})`
        ctx.fillRect(p.gx * cell, p.gy * cell, cell, cell)
      }
    }

    if (!match) return

    const [tMin] = match.time_range

    for (const player of match.players) {
      if (player.is_bot && !showBots) continue
      if (!player.is_bot && !showHumans) continue

      if (showPaths && player.path.length > 1) {
        ctx.beginPath()
        let started = false
        for (const [x, y, ts] of player.path) {
          if (ts > currentTime) break
          if (!started) {
            ctx.moveTo(x, y)
            started = true
          } else {
            ctx.lineTo(x, y)
          }
        }
        if (started) {
          ctx.strokeStyle = player.is_bot ? 'rgba(150,150,150,0.5)' : 'rgba(56, 189, 248, 0.9)'
          ctx.lineWidth = player.is_bot ? 1.5 : 2.5
          if (player.is_bot) ctx.setLineDash([6, 6])
          else ctx.setLineDash([])
          ctx.stroke()
          ctx.setLineDash([])
        }

        const last = player.path.filter((p) => p[2] <= currentTime).at(-1)
        if (last) {
          ctx.fillStyle = player.is_bot ? '#94a3b8' : '#38bdf8'
          ctx.beginPath()
          ctx.arc(last[0], last[1], player.is_bot ? 3 : 5, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      if (showEvents) {
        for (const ev of player.events) {
          if (ev.ts > currentTime) continue
          drawEventMarker(ctx, ev.x, ev.y, ev.event, 1)
        }
      }
    }

    // Elapsed label
    const elapsed = Math.max(0, (currentTime - tMin) / 1000)
    ctx.save()
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.fillStyle = 'rgba(0,0,0,0.55)'
    ctx.fillRect(8, 8, 110, 28)
    ctx.fillStyle = '#e2e8f0'
    ctx.font = '14px system-ui'
    ctx.fillText(`${elapsed.toFixed(1)}s`, 16, 28)
    ctx.restore()
  }

  return <canvas ref={canvasRef} className="minimap-canvas" />
}
