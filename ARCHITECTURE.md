# Architecture

## Overview

LILA Player Analyzer is a Next.js-based telemetry visualization tool for exploring player journeys, movement patterns, combat events, and map activity from LILA BLACK gameplay data.

The application uses a preprocessing step to convert the supplied Parquet telemetry into browser-friendly JSON. The frontend then renders the selected match interactively with player paths, event markers, timeline playback, filters, and heatmap overlays.

## Stack

- **Next.js + React + TypeScript** — application and interactive UI
- **Tailwind CSS** — dashboard styling
- **Python + Pandas/PyArrow** — Parquet parsing and preprocessing
- **SVG** — player paths, markers, and heatmap overlays
- **Vercel** — deployment

Next.js was chosen because the final product is an interactive browser-based visualization. Python is used as a preprocessing step so the browser does not need to parse the full collection of Parquet files at runtime.

## Data Flow

Raw Parquet files
       │
       ▼
Python preprocessing
       │
       ├── Parse Parquet rows
       ├── Group rows by match_id
       ├── Identify humans / bots
       ├── Decode event payloads
       ├── Convert world coordinates
       │   to minimap coordinates
       │
       ▼
matches.json + match_index.json
       │
       ▼
Next.js application
       │
       ├── Match / date / map filtering
       ├── Player filtering
       ├── Timeline / playback
       ├── Player paths
       ├── Event markers
       └── Heatmap overlays


`match_index.json` contains lightweight metadata used for match selection and filtering.

`matches.json` contains the player journeys, positions, and events required to render a selected match.

Each gameplay Parquet file represents one player's journey through one match.

## Coordinate Mapping

The supplied dataset provides a scale and world-space origin for each map. I use these values directly rather than estimating the mapping from the minimap images.

For a world position `(x, z)`:

u = (x - origin_x) / scale
v = (z - origin_z) / scale

pixel_x = u * 1024
pixel_y = (1 - v) * 1024

The `y` coordinate represents elevation and is therefore not used for the 2D minimap.

### Map Configuration

The coordinate transformation uses the following map-specific values:

- **Ambrose Valley**
  - Scale: `900`
  - Origin X: `-370`
  - Origin Z: `-473`

- **Grand Rift**
  - Scale: `581`
  - Origin X: `-290`
  - Origin Z: `-290`

- **Lockdown**
  - Scale: `1000`
  - Origin X: `-500`
  - Origin Z: `-500`

The resulting coordinates are in the same `1024 × 1024` coordinate space used by the minimap and SVG overlay. This allows player paths, player markers, event markers, and heatmaps to align with the underlying map image.

## Human and Bot Detection

The dataset README defines UUID-style `user_id` values as human players and short numeric IDs as bots.

This distinction is preserved during preprocessing and exposed to the frontend as `isHuman`.

The UI then uses different visual treatments for human players and bots and allows them to be filtered independently.

## Events

The preprocessing pipeline decodes the supplied event payloads and preserves the event types used by the dataset:

- `Kill`
- `Killed`
- `BotKill`
- `BotKilled`
- `KilledByStorm`
- `Loot`
- `Position`
- `BotPosition`

Position events are used to reconstruct player movement, while gameplay events are rendered as distinct markers.

## Playback

The selected match is displayed using a timeline controlled by the current match time.

As playback advances:

- Player positions are updated.
- Paths are progressively revealed.
- Event markers appear once their event timestamp has been reached.
- The selected player can be isolated from the rest of the match.

This provides a chronological view of player movement and gameplay events without requiring a backend service.

## Heatmaps

Three heatmap modes are provided:

- **Traffic** — aggregates player position telemetry
- **Kills** — aggregates kill event locations
- **Deaths** — aggregates player death and storm-death locations

The heatmap implementation divides the `1024 × 1024` minimap coordinate space into a grid and aggregates observations into grid cells.

The heatmaps are rendered as SVG overlays so they share the same coordinate system as the player paths and event markers.

## Filtering

The interface supports filtering by:

- Map
- Date
- Match
- Human / bot players
- Individual player
- Event type

The match index is used for map/date/match selection so the main match data does not need to be repeatedly parsed.

## Data Assumptions and Ambiguities

The supplied dataset contains timestamps stored as millisecond timestamps. The dataset documentation describes `ts` as elapsed time within a match, while the decoded timestamps appear around January 1970.

The reconstructed match durations are also substantially shorter than the README's description of matches lasting several minutes.

Rather than inventing a timestamp conversion, I preserved the supplied timestamp ordering and values and use the relative telemetry timeline consistently for playback.

The supplied dataset also contains a partial February 14 dataset, so date-level counts should not be interpreted as complete daily gameplay samples.

## Major Tradeoffs

The architecture makes the following implementation choices:

### Runtime Parquet Parsing

**Decision:** Preprocess to JSON

**Reason:** Avoids parsing thousands of Parquet files in the browser and simplifies deployment.

### Data Storage

**Decision:** Static JSON

**Reason:** The assignment does not require a backend or persistent database.

### Rendering

**Decision:** SVG overlays

**Reason:** Provides precise alignment with the `1024 × 1024` minimap coordinate space.

### Heatmap Implementation

**Decision:** Client-side grid aggregation

**Reason:** Keeps the interaction simple and responsive for the supplied dataset.

### Match Filtering

**Decision:** Precomputed match index

**Reason:** Keeps map, date, and match selection lightweight.

### Playback

**Decision:** Client-side

**Reason:** Provides immediate interaction without server requests.

### Deployment

**Decision:** Vercel

**Reason:** Simple deployment for a Next.js application.

### Map Loading

**Decision:** Loading state tied to image load

**Reason:** Prevents telemetry overlays from appearing over a previous map while a new map is loading.

## Result

The final architecture keeps the data pipeline deterministic and lightweight while moving the interactive exploration experience into the browser. The separation between preprocessing and visualization also makes the coordinate transformation, bot detection, event decoding, and other dataset-specific assumptions explicit and testable.
