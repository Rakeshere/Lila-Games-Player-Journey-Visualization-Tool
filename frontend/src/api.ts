import type { DateInfo, HeatmapData, MapInfo, MatchData, MatchSummary } from './types'

const USE_STATIC = import.meta.env.VITE_STATIC_DATA === 'true'
const API_BASE = import.meta.env.VITE_API_URL ?? ''

async function get<T>(path: string): Promise<T> {
  const url = USE_STATIC ? path : `${API_BASE}${path}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

let matchesCache: MatchSummary[] | null = null

async function allMatches(): Promise<MatchSummary[]> {
  if (!matchesCache) {
    matchesCache = await get<MatchSummary[]>('/data/matches.json')
  }
  return matchesCache
}

export const fetchMaps = () =>
  USE_STATIC ? get<MapInfo[]>('/data/maps.json') : get<MapInfo[]>('/api/maps')

export const fetchDates = () =>
  USE_STATIC ? get<DateInfo[]>('/data/dates.json') : get<DateInfo[]>('/api/dates')

export async function fetchMatches(params: Record<string, string>) {
  if (!USE_STATIC) {
    const q = new URLSearchParams(params).toString()
    return get<{ matches: MatchSummary[]; total: number }>(`/api/matches?${q}`)
  }

  let matches = await allMatches()
  if (params.map_id) {
    matches = matches.filter((m) => m.map_id === params.map_id)
  }
  if (params.date) {
    matches = matches.filter((m) => m.date === params.date)
  }
  matches = [...matches].sort((a, b) => b.player_count - a.player_count)
  const limit = params.limit ? parseInt(params.limit, 10) : 200
  return { matches: matches.slice(0, limit), total: matches.length }
}

export const fetchMatch = (id: string) =>
  USE_STATIC
    ? get<MatchData>(`/data/matches/${id.replace('.nakama-0', '')}.json`)
    : get<MatchData>(`/api/match/${id}`)

export const fetchHeatmap = (mapId: string, type: string, _date?: string) =>
  USE_STATIC
    ? get<HeatmapData>(`/data/heatmaps/${mapId}-${type}.json`)
    : get<HeatmapData>(
        `/api/heatmap?${new URLSearchParams({ map_id: mapId, type, ...(_date ? { date: _date } : {}) })}`,
      )
