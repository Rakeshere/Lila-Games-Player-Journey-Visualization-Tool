import type { DateInfo, HeatmapData, MapInfo, MatchData, MatchSummary } from './types'

const API = import.meta.env.VITE_API_URL ?? ''

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API}${path}`)
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export const fetchMaps = () => get<MapInfo[]>('/api/maps')
export const fetchDates = () => get<DateInfo[]>('/api/dates')
export const fetchMatches = (params: Record<string, string>) => {
  const q = new URLSearchParams(params).toString()
  return get<{ matches: MatchSummary[]; total: number }>(`/api/matches?${q}`)
}
export const fetchMatch = (id: string) => get<MatchData>(`/api/match/${id}`)
export const fetchHeatmap = (mapId: string, type: string, date?: string) => {
  const q = new URLSearchParams({ map_id: mapId, type, ...(date ? { date } : {}) })
  return get<HeatmapData>(`/api/heatmap?${q}`)
}
