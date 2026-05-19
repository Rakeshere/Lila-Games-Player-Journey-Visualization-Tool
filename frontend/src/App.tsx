import { useCallback, useEffect, useMemo, useState } from 'react'
import './App.css'
import { fetchDates, fetchHeatmap, fetchMaps, fetchMatch, fetchMatches } from './api'
import { MinimapCanvas } from './components/MinimapCanvas'
import type { DateInfo, HeatmapData, MapInfo, MatchData, MatchSummary } from './types'

type HeatmapMode = 'off' | 'kills' | 'deaths' | 'traffic'

export default function App() {
  const [maps, setMaps] = useState<MapInfo[]>([])
  const [dates, setDates] = useState<DateInfo[]>([])
  const [selectedMap, setSelectedMap] = useState('AmbroseValley')
  const [selectedDate, setSelectedDate] = useState('')
  const [matches, setMatches] = useState<MatchSummary[]>([])
  const [selectedMatchId, setSelectedMatchId] = useState('')
  const [match, setMatch] = useState<MatchData | null>(null)
  const [heatmapMode, setHeatmapMode] = useState<HeatmapMode>('off')
  const [heatmap, setHeatmap] = useState<HeatmapData | null>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [showHumans, setShowHumans] = useState(true)
  const [showBots, setShowBots] = useState(true)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    Promise.all([fetchMaps(), fetchDates()]).then(([m, d]) => {
      setMaps(m)
      setDates(d)
      if (d.length) setSelectedDate(d[0].id)
    })
  }, [])

  useEffect(() => {
    if (!selectedMap) return
    fetchMatches({
      map_id: selectedMap,
      ...(selectedDate ? { date: selectedDate } : {}),
      limit: '300',
    }).then((r) => {
      setMatches(r.matches)
      if (r.matches.length && !r.matches.find((x) => x.match_id === selectedMatchId)) {
        setSelectedMatchId(r.matches[0].match_id)
      }
    })
  }, [selectedMap, selectedDate])

  useEffect(() => {
    if (!selectedMatchId) return
    setLoading(true)
    fetchMatch(selectedMatchId)
      .then((data) => {
        setMatch(data)
        setCurrentTime(data.time_range[0])
        setPlaying(false)
      })
      .finally(() => setLoading(false))
  }, [selectedMatchId])

  useEffect(() => {
    if (heatmapMode === 'off') {
      setHeatmap(null)
      return
    }
    fetchHeatmap(selectedMap, heatmapMode, selectedDate || undefined).then(setHeatmap)
  }, [heatmapMode, selectedMap, selectedDate])

  const timeRange = match?.time_range ?? [0, 1]
  const duration = Math.max(1, timeRange[1] - timeRange[0])

  useEffect(() => {
    if (!playing || !match) return
    const id = window.setInterval(() => {
      setCurrentTime((t) => {
        const next = t + 200
        if (next >= timeRange[1]) {
          setPlaying(false)
          return timeRange[1]
        }
        return next
      })
    }, 80)
    return () => clearInterval(id)
  }, [playing, match, timeRange])

  const mapInfo = maps.find((m) => m.id === selectedMap)

  const legend = useMemo(
    () => [
      { label: 'Kill', color: '#22c55e', shape: '▲' },
      { label: 'Death', color: '#ef4444', shape: '✕' },
      { label: 'Loot', color: '#fbbf24', shape: '■' },
      { label: 'Storm', color: '#a855f7', shape: '●' },
    ],
    [],
  )

  const onScrub = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const pct = Number(e.target.value) / 1000
      setCurrentTime(timeRange[0] + pct * duration)
    },
    [timeRange, duration],
  )

  const scrubValue = Math.round(((currentTime - timeRange[0]) / duration) * 1000)

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>LILA BLACK — Player Journey</h1>
          <p className="subtitle">Level design telemetry · Feb 10–14, 2026</p>
        </div>
      </header>

      <aside className="sidebar">
        <section>
          <h2>Filters</h2>
          <label>
            Map
            <select value={selectedMap} onChange={(e) => setSelectedMap(e.target.value)}>
              {maps.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Date
            <select value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}>
              <option value="">All days</option>
              {dates.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Match
            <select
              value={selectedMatchId}
              onChange={(e) => setSelectedMatchId(e.target.value)}
              disabled={!matches.length}
            >
              {matches.map((m) => (
                <option key={m.match_id} value={m.match_id}>
                  {m.match_id.slice(0, 8)}… ({m.player_count} players, {m.event_count} events)
                </option>
              ))}
            </select>
          </label>
        </section>

        <section>
          <h2>Layers</h2>
          <label className="check">
            <input type="checkbox" checked={showHumans} onChange={(e) => setShowHumans(e.target.checked)} />
            Human paths
          </label>
          <label className="check">
            <input type="checkbox" checked={showBots} onChange={(e) => setShowBots(e.target.checked)} />
            Bot paths (dashed)
          </label>
        </section>

        <section>
          <h2>Heatmaps</h2>
          {(['off', 'kills', 'deaths', 'traffic'] as HeatmapMode[]).map((mode) => (
            <label key={mode} className="radio">
              <input
                type="radio"
                name="heatmap"
                checked={heatmapMode === mode}
                onChange={() => setHeatmapMode(mode)}
              />
              {mode === 'off' ? 'None' : mode.charAt(0).toUpperCase() + mode.slice(1)}
            </label>
          ))}
        </section>

        <section className="legend">
          <h2>Events</h2>
          {legend.map((l) => (
            <div key={l.label} className="legend-row">
              <span style={{ color: l.color }}>{l.shape}</span> {l.label}
            </div>
          ))}
          <div className="legend-row">
            <span className="swatch human" /> Human
          </div>
          <div className="legend-row">
            <span className="swatch bot" /> Bot
          </div>
        </section>
      </aside>

      <main className="main">
        {loading && <div className="loading">Loading match…</div>}
        {mapInfo && (
          <MinimapCanvas
            mapImage={mapInfo.image}
            match={match}
            heatmap={heatmap}
            currentTime={currentTime}
            showHumans={showHumans}
            showBots={showBots}
            showPaths
            showEvents
          />
        )}

        <div className="timeline">
          <button type="button" onClick={() => setPlaying((p) => !p)} disabled={!match}>
            {playing ? '⏸ Pause' : '▶ Play'}
          </button>
          <input
            type="range"
            min={0}
            max={1000}
            value={scrubValue}
            onChange={onScrub}
            disabled={!match}
          />
          <span className="time-label">
            {match
              ? `${((currentTime - timeRange[0]) / 1000).toFixed(1)}s / ${(duration / 1000).toFixed(1)}s`
              : '—'}
          </span>
        </div>

        {match && (
          <p className="match-meta">
            Match <code>{match.match_id}</code> · {match.players.filter((p) => !p.is_bot).length} humans ·{' '}
            {match.players.filter((p) => p.is_bot).length} bots
          </p>
        )}
      </main>
    </div>
  )
}
