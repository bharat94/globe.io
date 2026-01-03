# Globe.io

An interactive 3D globe visualization to explore cities, weather patterns, and population data around the world.

## Features

- **Explorer View** - Discover 50 major cities with rich details (population, climate, languages, industries)
- **Weather View** - Historical temperature heatmaps (2000-2024) with time-travel playback
- **Population View** - Country population data (1960-2023) with demographics on click
- **Day/Night Mode** - Toggle between day and night globe themes
- **Progressive Loading** - Higher resolution data loads as you zoom in

## Quick Start

```bash
# Clone and start
git clone https://github.com/bharat94/globe.io.git
cd globe.io
npm start
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Prerequisites

- Node.js v16+
- MongoDB (local)

### Stopping

```bash
npm stop          # Stop frontend & backend
npm run stop:all  # Stop everything including MongoDB
```

## How to Use

| Action | How |
|--------|-----|
| Rotate globe | Drag |
| Zoom | Scroll |
| Switch views | Click icons on left sidebar |
| City details | Click city marker (Explorer view) |
| Country details | Click country bubble (Population view) |
| Time travel | Use slider at bottom (Weather/Population views) |
| Theme | Toggle sun/moon at top |

## Views

### Explorer View
Click any of 50 cities to see:
- Population, area, elevation
- Climate type, timezone
- Languages, currency
- Famous landmarks, fun facts

### Weather View
- Global temperature heatmap
- Time-travel from 2000-2024 (monthly)
- Play/pause animation
- Click for location details

### Population View
- Country population bubbles (sized by population)
- Time-travel from 1960-2023 (yearly)
- Click any country to see:
  - Gender distribution (male/female)
  - Age breakdown (children, working age, elderly)
  - Urban vs rural split
  - Life expectancy, growth rate, fertility rate
  - Population history sparkline

## Data Sources

| Data | Source | Coverage |
|------|--------|----------|
| Cities | Curated | 50 major cities |
| Weather | Open-Meteo API | 2000-2024, global |
| Population | World Bank API | 1960-2023, 89 countries |

## Documentation

- [Development Guide](./DEVELOPMENT.md) - Architecture, API, adding features
- [Data Ingestion Guide](./DATA_INGESTION.md) - CLI tools, quota management

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite, react-globe.gl, Three.js
- **Backend:** Node.js, Express, MongoDB, Mongoose
- **APIs:** Open-Meteo (weather), World Bank (population)

## License

MIT
