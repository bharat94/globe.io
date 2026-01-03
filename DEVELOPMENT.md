# Development Guide

Technical documentation for Globe.io developers.

## Architecture

```
globe.io/
├── src/                      # React frontend (Vite + TypeScript)
│   ├── Globe.tsx             # Main visualization component
│   ├── hooks/                # Data fetching hooks
│   │   ├── useWeatherData.ts
│   │   ├── usePopulationData.ts
│   │   └── useGlobeData.ts   # Generic data hook
│   ├── components/           # UI components by view
│   │   ├── weather/
│   │   └── population/
│   ├── datasources/          # Data source abstraction
│   │   ├── types.ts
│   │   └── sources/
│   └── types/                # TypeScript definitions
│
├── server/                   # Express backend
│   ├── index.js              # Server entry point
│   ├── routes/               # API endpoints
│   │   ├── cities.js
│   │   ├── weather.js
│   │   └── population.js
│   ├── models/               # Mongoose schemas
│   │   ├── TemperatureData.js
│   │   ├── PopulationData.js
│   │   └── WeatherCache.js
│   ├── datasources/          # Data source abstraction (backend)
│   │   ├── DataService.js
│   │   ├── DataSourceFactory.js
│   │   └── sources/
│   └── ingestion/            # CLI data ingestion tools
│       ├── index.js
│       ├── config.js
│       └── ingesters/
```

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│ Frontend                                                    │
│  Globe.tsx → useWeatherData() → fetch('/api/weather/...')   │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ Backend                                                     │
│  routes/weather.js → DataService → WeatherSourceAdapter     │
│                                          │                  │
│                          ┌───────────────┴───────────────┐  │
│                          ▼                               ▼  │
│               WeatherStaticSource           WeatherDynamicSource
│               (MongoDB: pre-ingested)       (Open-Meteo API + cache)
└─────────────────────────────────────────────────────────────┘
```

**Resolution Selection:**
- Pre-ingested resolutions (10°, 5°, 2.5°) → StaticSource (fast, from DB)
- Dynamic resolutions (2°, 1°, 0.5°) → DynamicSource (live API, cached)

## API Reference

### Weather API

| Endpoint | Description |
|----------|-------------|
| `GET /api/weather/years` | Year range `{ minYear, maxYear }` |
| `GET /api/weather/grid/:year/:month` | Heatmap grid data |
| `GET /api/weather/heatmap/:year/:month` | Legacy heatmap format |
| `GET /api/weather/location/:lat/:lng` | Weather history for location |
| `GET /api/weather/trend/:cityName` | Temperature trend for city |
| `GET /api/weather/quota` | API quota status |

**Grid endpoint query params:**
- `resolution` - Grid resolution in degrees (10, 5, 2.5, 2, 1, 0.5)
- `minLat, maxLat, minLng, maxLng` - Viewport bounds for filtering

### Population API

| Endpoint | Description |
|----------|-------------|
| `GET /api/population/years` | Year range `{ minYear, maxYear }` |
| `GET /api/population/data/:year` | All countries for a year |
| `GET /api/population/country/:code` | Country population history |
| `GET /api/population/country/:code/details?year=2020` | Demographics (live from World Bank) |
| `GET /api/population/top/:year?limit=10` | Top countries by population |
| `GET /api/population/stats` | Database statistics |

### Cities API

| Endpoint | Description |
|----------|-------------|
| `GET /api/cities` | All 50 cities with details |
| `GET /api/cities/:id` | Single city by ID |

## Database Models

### TemperatureData
```javascript
{
  lat: Number,           // Latitude
  lng: Number,           // Longitude
  year: Number,          // 2000-2024
  month: Number,         // 1-12
  resolution: Number,    // 10, 5, or 2.5 degrees
  temperature: Number,   // Average temperature (°C)
  weight: Number         // Normalized 0-1 for visualization
}
// Indexed: { lat, lng, year, month, resolution }
```

### PopulationData
```javascript
{
  countryCode: String,   // 2-letter ISO code (US, CN, IN)
  countryCode3: String,  // 3-letter ISO code (USA, CHN, IND)
  countryName: String,
  lat: Number,           // Country centroid
  lng: Number,
  year: Number,          // 1960-2023
  population: Number
}
// Indexed: { countryCode, year }
```

### WeatherCache
```javascript
{
  key: String,           // "lat,lng,year,month"
  data: Object,          // Cached API response
  createdAt: Date        // TTL: 7 days
}
```

## Adding a New View

1. **Define type** in `src/types/views.ts`:
   ```typescript
   export type ViewType = 'explorer' | 'weather' | 'population' | 'yourview';
   ```

2. **Create data hook** in `src/hooks/useYourViewData.ts`:
   ```typescript
   export const useYourViewData = () => {
     // Fetch and manage data
     return { data, loading, error, ... };
   };
   ```

3. **Create components** in `src/components/yourview/`:
   - Panel component (side panel on click)
   - Legend component (bottom legend)
   - TimeSlider if time-based

4. **Update Globe.tsx**:
   - Import hook and components
   - Add conditional rendering based on `currentView`
   - Configure react-globe.gl layers (points, polygons, arcs, etc.)

5. **Add backend routes** if needed in `server/routes/yourview.js`

## Adding a New Data Source

For backend data abstraction (static vs dynamic):

1. **Create source class** in `server/datasources/sources/yourdata/`:
   ```javascript
   class YourStaticSource extends StaticDataSource {
     async fetchGridData(query) { /* MongoDB query */ }
   }
   class YourDynamicSource extends DynamicDataSource {
     async fetchGridData(query) { /* API call */ }
   }
   ```

2. **Create adapter** that combines them:
   ```javascript
   class YourSourceAdapter {
     async fetchGridData(query) {
       if (this.staticSource.supportsResolution(query.resolution)) {
         return this.staticSource.fetchGridData(query);
       }
       return this.dynamicSource.fetchGridData(query);
     }
   }
   ```

3. **Register in DataSourceFactory.js**

## Running Tests

```bash
# Frontend tests
npm run test:run

# Type checking
npx tsc --noEmit

# Lint (if configured)
npm run lint
```

## Environment Variables

Create `server/.env`:
```
MONGODB_URI=mongodb://localhost:27017/globe-io
LOG_LEVEL=info
```

## Common Issues

**MongoDB connection failed:**
```bash
brew services start mongodb-community
```

**Port 3001 already in use:**
```bash
lsof -i :3001  # Find process
kill -9 <PID>  # Kill it
```

**Weather data not loading:**
- Check API quota: `GET /api/weather/quota`
- Verify DB has data: `node server/ingestion/index.js stats --type temperature`
