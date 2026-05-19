# Game Insights — LILA BLACK Telemetry (Feb 10–14, 2026)

Analysis of ~89,000 events across 796 matches, 339 unique players, 3 maps.

---

## Insight 1: Ambrose Valley dominates the live playlist

**What I Found:** Ambrose Valley accounts for roughly **71% of matches** (566 / 796) and **68% of event volume** (~61k rows). Grand Rift and Lockdown see far less production traffic.

**Evidence:**
| Map | Matches | Share |
|-----|---------|-------|
| AmbroseValley | 566 | 71% |
| Lockdown | 171 | 21% |
| GrandRift | 59 | 7% |

**Actionable Items:**
- Prioritize layout iteration and storm-timing tuning on **Ambrose Valley** first → affects retention and session length for the majority of players.
- Use Grand Rift / Lockdown telemetry to **A/B new mechanics** before rolling to the primary map → limits risk to most players.
- Add playlist weights or featured modes to boost underplayed maps if variety is a design goal → affects map engagement distribution.

**Why Level Designers Care:** Most player feedback and friction will surface on the map players actually play. Under-tested maps may hide layout issues until rotation increases.

---

## Insight 2: Bots generate ~30% of movement samples but different combat signals

**What I Found:** Bot position samples (`BotPosition`) are **~31%** of all movement events (22,348 bot vs 50,711 human). Bots fill lobbies but human `Kill`/`Killed` events are extremely rare in this window (3 each), while **BotKill** events are common (2,415).

**Evidence:**
- Human position samples: 50,711  
- Bot position samples: 22,348  
- `BotKill`: 2,415 vs human `Kill`: 3  
- Heatmap “traffic” on Ambrose Valley shows dense bot corridors overlapping human loot routes

**Actionable Items:**
- Tune **bot patrol paths** away from high-value loot clusters → affects human loot fairness and PvE pressure.
- Reduce bot density near extract routes during mid-match → affects extraction success rate.
- Tag bot kills separately in dashboards (already done in tool) → improves signal when balancing TTK.

**Why Level Designers Care:** Bots shape perceived difficulty and map congestion. If bots dominate kill heatmaps, designers may misattribute friction to layout when it’s AI placement.

---

## Insight 3: Storm deaths are rare but map-specific — opportunity to tune pressure

**What I Found:** Only **39** `KilledByStorm` events in 5 days, split across maps (17 Ambrose Valley, 17 Lockdown, 5 Grand Rift). Lockdown has fewer matches but similar storm death count to Ambrose Valley → **higher storm death rate per match** on the smaller map.

**Evidence:**
- Total storm deaths: 39 / ~796 matches ≈ **4.9% of matches** include at least one storm death event in sample  
- Lockdown: 171 matches, 17 storm deaths  
- Ambrose Valley: 566 matches, 17 storm deaths  

**Actionable Items:**
- Review **extract path length vs storm sweep** on Lockdown → affects `KilledByStorm` rate and match frustration.
- Add clearer visual funnel toward safe zones on Ambrose Valley edges where storm deaths cluster (use heatmap overlay) → affects time-to-extract.
- Adjust storm speed curve if designers want more pressure without hard deaths → affects match pacing metrics.

**Why Level Designers Care:** Extraction shooters live or die on tension between looting and leaving. Storm deaths are a direct signal that the timer/geometry forces movement effectively—or punishes unfairly.
