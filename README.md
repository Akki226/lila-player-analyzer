# LILA Player Analyzer

A web-based telemetry visualization tool for exploring player journeys, movement patterns, events, and map activity from LILA BLACK gameplay data.

## Live Demo

[https://lila-player-analyzer.vercel.app/](https://lila-player-analyzer.vercel.app/)

## Features

- Player journeys rendered on the correct minimap
- Human and bot visualization
- Kill, death, loot, and storm-death markers
- Map, date, match, player, and event filtering
- Timeline playback
- Traffic, kill, and death heatmaps
- Player and match-level insights

## Tech Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- Python
- Pandas / PyArrow
- Apache Parquet
- SVG
- Vercel

## Local Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Run the Application

```bash
npm run dev
```

Open the application at:

```text
http://localhost:3000
```

### 3. Production Build

```bash
npm run build
```

## Data Preprocessing

The supplied Parquet files are preprocessed using:

```bash
python scripts/preprocess_data.py
```

This generates:

```text
processed/
├── matches.json
└── match_index.json
```

Copy the generated files into `public/data/`:

```bash
cp processed/matches.json public/data/matches.json
cp processed/match_index.json public/data/match_index.json
```

### Python Dependencies

```bash
pip install pandas pyarrow
```

## Environment Variables

No environment variables are required.

The application does not require a runtime backend, database, authentication service, or external API.

## Documentation

- **`ARCHITECTURE.md`** — architecture, data flow, coordinate mapping, assumptions, and tradeoffs
- **`INSIGHTS.md`** — three gameplay observations derived from the supplied telemetry

## Dataset Notes

The supplied dataset contains five days of LILA BLACK gameplay telemetry and minimap assets for three maps.

The application uses the supplied coordinate system and preserves the timestamp ordering from the source telemetry. See `ARCHITECTURE.md` for details on the timestamp ambiguity and other data assumptions.

## Deployment

The application is deployed on Vercel:

[https://lila-player-analyzer.vercel.app/](https://lila-player-analyzer.vercel.app/)
