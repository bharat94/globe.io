# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Globe.io is an interactive 3D globe visualization built with React and react-globe.gl. It displays multiple data views including city exploration, weather patterns, population, earthquakes, satellites, air pollution, and live flight tracking.

## Development Commands

```bash
# Start everything (MongoDB, backend, frontend)
npm start          # or npm run bootstrap

# Stop services
npm stop           # keeps MongoDB running
npm run stop:all   # stops MongoDB too

# Development
npm run dev        # Vite dev server (frontend only)
npm run dev:server # Backend only (cd server && npm start)

# Build & Lint
npm run build      # TypeScript compile + Vite build
npm run lint       # ESLint

# Testing
npm test           # Vitest watch mode
npm run test:run   # Single test run
npx vitest run src/hooks/__tests__/useWeatherData.test.ts  # Run single test file

# Database
npm run seed       # Seed cities data
cd server && npm run seed:population  # Seed population data
```

## Architecture

### Frontend (`src/`)
- **Globe.tsx**: Main component orchestrating all views. Uses react-globe.gl with THREE.js for 3D rendering.
- **types/views.ts**: Defines available views (explorer, weather, population, earthquakes, satellites, pollution, flights)
- **hooks/use*Data.ts**: Custom hooks for each data domain (useWeatherData, useEarthquakeData, etc.). Each manages fetching, state, and transformations.
- **components/{domain}/**: View-specific UI components (Panel, Legend, Controls for each domain)
- **datasources/**: Data fetching abstraction layer with BaseDataSource class

### Backend (`server/`)
- Express.js + MongoDB (Mongoose)
- **routes/**: API endpoints for each domain (/api/cities, /api/weather, /api/earthquakes, etc.)
- **models/**: Mongoose schemas (City, WeatherData, PopulationData, etc.)
- **data/**: Seed scripts for initial data
- **ingestion/**: CLI tools for temperature data ingestion at different resolutions

### Key Patterns
- Each view has its own hook (use*Data) that returns data + controls + loading state
- Globe component renders different layers based on currentView state
- URL state syncing via useUrlState hook for shareable links
- Universal search via useSearch hook indexes cities, earthquakes, satellites

## External APIs Used
- Open-Meteo API: Weather and air quality data
- USGS: Earthquake data
- CelesTrak: Satellite TLE data
- OpenSky Network: Live flight data

## Configuration
- Frontend runs on port 5173 (Vite default)
- Backend runs on port 3001
- MongoDB on port 27017, database: globe-io
