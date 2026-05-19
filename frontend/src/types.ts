export interface MapInfo {
  id: string
  label: string
  image: string
  scale: number
  origin_x: number
  origin_z: number
}

export interface DateInfo {
  id: string
  label: string
  iso: string
}

export interface MatchSummary {
  match_id: string
  map_id: string
  date: string
  start_ts: number
  end_ts: number
  player_count: number
  event_count: number
}

export interface PlayerEvent {
  x: number
  y: number
  ts: number
  event: string
}

export interface PlayerJourney {
  user_id: string
  is_bot: boolean
  path: [number, number, number][]
  events: PlayerEvent[]
}

export interface MatchData {
  match_id: string
  map_id: string
  players: PlayerJourney[]
  time_range: [number, number]
}

export interface HeatmapPoint {
  gx: number
  gy: number
  intensity: number
}

export interface HeatmapData {
  grid_size: number
  points: HeatmapPoint[]
}
