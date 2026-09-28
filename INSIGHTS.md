# Gameplay Insights

The following observations are based on the supplied five-day telemetry dataset. They describe patterns in this dataset and should not automatically be interpreted as representative of the entire player population.

## 1. The Dataset Is Heavily Weighted Toward Ambrose Valley

### What caught my attention

The three maps are not represented equally in the supplied matches.

| Map | Matches | Share |
|---|---:|---:|
| Ambrose Valley | 566 | 71.1% |
| Lockdown | 171 | 21.5% |
| Grand Rift | 59 | 7.4% |
| **Total** | **796** | **100%** |

Ambrose Valley accounts for roughly 71% of the reconstructed matches, while Grand Rift accounts for less than 8%.

### What could be actionable?

Before making level-design decisions from aggregated telemetry, map-level metrics should be normalized by the amount of available match data.

For example:

- Compare traffic density per match rather than only total traffic.
- Compare kill/death hotspots relative to the number of matches played on each map.
- Track map-specific player coverage and event rates separately.

### Why a level designer should care

A raw heatmap across the complete dataset can make a more heavily represented map appear more important simply because it has more telemetry.

Map-normalized metrics would make it easier to distinguish actual behavioral differences between maps from differences caused by the amount of data collected.

> **Caveat:** The dataset distribution may reflect the supplied production sample rather than player preference or map popularity.

---

## 2. Most Matches in the Dataset Contain a Single Human Player

### What caught my attention

The reconstructed dataset contains **796 matches**.

Of these, **743 matches contain exactly one human player and no bots**, representing approximately **93.3% of all matches**.

The remaining matches contain different combinations of humans and bots, including several matches with large bot populations.

This means the majority of the supplied match records are effectively individual player journeys rather than dense multi-player encounters.

### What could be actionable?

When analyzing movement or level flow, it is useful to separate:

- Solo journey behavior
- Human-vs-human encounters
- Human-vs-bot encounters
- Matches with larger numbers of participants

For example, a future version of the tool could expose metrics such as:

- Average player density by map region
- Human encounter rate
- Time to first encounter
- Human-vs-bot combat rate
- Traffic in regions before and after encounters

### Why a level designer should care

A region with low combat activity is not necessarily being avoided by players.

It may simply be that the supplied match sample contains relatively few human-vs-human interactions.

Separating solo movement from encounter-heavy matches would make it easier to understand whether a location is genuinely quiet or whether the available sample is simply sparse.

> **Caveat:** This is a characteristic of the supplied dataset and should not be interpreted as saying that the game itself is predominantly played solo.

---

## 3. The Telemetry Is Dominated by Movement Data, While Recorded Combat Events Are Heavily Bot-Related

### What caught my attention

The dataset contains approximately **89,104 event rows**.

The largest event categories are movement-related:

| Event type | Count | Share |
|---|---:|---:|
| Position | 51,347 | 57.6% |
| BotPosition | 21,712 | 24.4% |
| Loot | 12,885 | 14.5% |
| BotKill | 2,415 | 2.7% |
| BotKilled | 700 | 0.8% |
| KilledByStorm | 39 | <0.1% |
| Kill | 3 | <0.1% |
| Killed | 3 | <0.1% |

`Position` and `BotPosition` together account for approximately **82% of all recorded events**.

The recorded kill/death events are also overwhelmingly represented by `BotKill` and `BotKilled` rather than the human `Kill` and `Killed` event types.

### What could be actionable?

For level-design analysis, movement and combat should be treated as separate signals.

Useful derived metrics could include:

- Traffic density per map region
- Loot-to-traffic ratio
- Combat events per 1,000 movement observations
- Human-vs-bot combat hotspots
- Death rate relative to traffic
- Storm deaths relative to player presence

This would help distinguish areas that are:

- Frequently traversed
- Loot-rich but low-conflict
- High-traffic and high-conflict
- High-risk relative to the amount of player traffic

### Why a level designer should care

High traffic does not necessarily mean an area is dangerous, and low traffic does not necessarily mean an area is safe.

Combining movement, loot, kills, deaths, and storm events gives a more useful picture of how spaces are actually being used.

The current tool exposes these signals independently through player paths, event markers, and heatmaps, which provides a foundation for this type of analysis.

> **Caveat:** The event distribution reflects the supplied telemetry schema and match composition. It should not be interpreted as a complete measure of all combat occurring in the game.

---

## Summary

Three practical takeaways from the supplied telemetry are:

1. **Map representation is uneven**, with Ambrose Valley accounting for about 71% of reconstructed matches.
2. **The sample is heavily dominated by single-human-player matches**, so multi-player encounter analysis should be treated separately.
3. **Most telemetry represents movement**, while the recorded combat events are overwhelmingly bot-related, making segmentation important when interpreting combat hotspots.

These observations suggest that a useful level-design workflow should combine normalized map-level metrics with separate human/bot and movement/combat views rather than relying on raw event counts alone.