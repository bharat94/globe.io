# Globe.io

An interactive 3D globe visualization with multiple views to explore cities, weather, flights, and pollution data around the world.

![Globe.io Screenshot](screenshot.png)

## Features

- 🌍 **Multi-View System** - Switch between Explorer, Weather, Flights, and Pollution views
- 🎨 **Interactive 3D Globe** - Built with Three.js and react-globe.gl
- 🏙️ **30 Major Cities** - Comprehensive data from around the world
- 📊 **Rich City Information** - Population, area, elevation, climate, languages, currency, and more
- 🎯 **Click & Explore** - Interactive markers with detailed information panels
- 🌓 **Day/Night Mode** - Toggle between day and night globe themes
- ✨ **Smooth Animations** - Beautiful camera transitions and atmospheric effects

---

## 👥 For Users

### Quick Start

The easiest way to get started:

```bash
# Clone the repository
git clone https://github.com/bharat94/globe.io.git
cd globe.io

# Start everything (automatic setup)
npm start
```

That's it! Open [http://localhost:5173](http://localhost:5173) in your browser.

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local installation)
- npm or yarn

### How to Use

1. **Rotate** - Drag the globe to rotate and explore
2. **Zoom** - Scroll to zoom in/out
3. **Select View** - Click the view icons on the left (Explorer 🌍, Weather 🌤️, Flights ✈️, Pollution 🏭)
4. **Explore Cities** - Click on city markers to view detailed information
5. **Learn More** - Expand the "Learn More" section for additional city data
6. **Toggle Theme** - Switch between day ☀️ and night 🌙 modes

### Stopping the App

```bash
# Stop frontend & backend (keeps MongoDB running)
npm stop

# Stop everything including MongoDB
npm run stop:all
```

### Cities Featured

Explore **30 major cities** from around the world:

**Asia-Pacific:** Tokyo, Beijing, Shanghai, Seoul, Singapore, Bangkok, Jakarta, Mumbai, Delhi, Sydney, Melbourne

**Americas:** New York, Los Angeles, Toronto, Mexico City, São Paulo, Rio de Janeiro, Buenos Aires

**Europe:** London, Paris, Berlin, Rome, Madrid, Barcelona, Amsterdam, Moscow

**Middle East & Africa:** Dubai, Istanbul, Cairo, Lagos

---

## 🛠️ For Developers

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    User's Browser                        │
│                 http://localhost:5173                    │
└─────────────────────────────────────────────────────────┘
                           │
                           │ HTTP Requests
                           ↓
┌─────────────────────────────────────────────────────────┐
│              React Frontend (Vite)                       │
│  - Multi-view system (Explorer/Weather/Flights/etc)     │
│  - Globe.gl 3D visualization                            │
│  - ViewSelector component (semi-dial)                   │
│  - Day/night mode toggle                                │
│  - City detail panels with expandable sections          │
│  Port: 5173                                             │
└─────────────────────────────────────────────────────────┘
                           │
                           │ fetch('/api/cities')
                           ↓
┌─────────────────────────────────────────────────────────┐
│           Express REST API Server                        │
│  - GET /api/cities                                      │
│  - GET /api/cities/:name                                │
│  - GET /api/cities/near/:lng/:lat                       │
│  Port: 3001                                             │
└─────────────────────────────────────────────────────────┘
                           │
                           │ Mongoose ODM
                           ↓
┌─────────────────────────────────────────────────────────┐
│                MongoDB Database                          │
│  Database: globe-io                                     │
│  Collection: cities (30 documents)                      │
│  - Geospatial indexes (2dsphere)                        │
│  - Extended city data (9 additional fields)             │
│  Port: 27017                                            │
└─────────────────────────────────────────────────────────┘
```

### Tech Stack

**Frontend:**
- React 18 + TypeScript
- Vite (dev server & build tool)
- react-globe.gl + Three.js
- Multi-view architecture

**Backend:**
- Node.js + Express
- MongoDB + Mongoose
- RESTful API
- Geospatial indexing (2dsphere)

**DevOps:**
- Smart bootstrap script (idempotent)
- Graceful teardown script
- Automatic dependency management

### Project Structure

```
globe.io/
├── src/
│   ├── components/
│   │   └── ViewSelector.tsx      # Semi-dial view switcher
│   ├── types/
│   │   └── views.ts               # View type definitions
│   ├── Globe.tsx                  # Main globe component
│   ├── citiesData.ts              # City type interface
│   ├── App.tsx
│   └── main.tsx
├── server/
│   ├── models/
│   │   └── City.js                # Mongoose schema
│   ├── routes/
│   │   └── cities.js              # API endpoints
│   ├── data/
│   │   └── seed.js                # Database seeding
│   └── index.js                   # Express server
├── bootstrap.sh                   # Smart startup script
├── teardown.sh                    # Graceful shutdown script
└── package.json
```

### Development Setup

#### Manual Setup (Alternative)

**1. Install MongoDB**

macOS:
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

Linux (Ubuntu/Debian):
```bash
sudo apt-get install mongodb
sudo systemctl start mongod
```

**2. Install Dependencies**

```bash
# Frontend dependencies
npm install

# Backend dependencies
cd server && npm install
```

**3. Seed Database**

```bash
npm run seed
```

**4. Start Servers Manually**

Terminal 1:
```bash
npm run dev:server
```

Terminal 2:
```bash
npm run dev
```

### Available Scripts

**Lifecycle:**
- `npm start` - Smart bootstrap (starts everything needed)
- `npm stop` - Stop frontend & backend (keeps MongoDB & data)
- `npm run stop:all` - Stop everything including MongoDB

**Development:**
- `npm run dev` - Start frontend dev server only
- `npm run dev:server` - Start backend API server only
- `npm run seed` - Seed MongoDB with city data

**Build & Test:**
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Adding a New View

The multi-view architecture makes it easy to add new views:

**1. Enable the view** in `src/types/views.ts`:
```typescript
{
  id: 'weather',
  name: 'Weather',
  icon: '🌤️',
  description: 'View global weather patterns',
  enabled: true  // Change from false to true
}
```

**2. Add data fetching** in `src/Globe.tsx`:
```typescript
case 'weather':
  const weatherData = await fetch('/api/weather');
  const data = await weatherData.json();
  setWeatherData(data);
  break;
```

**3. Add view-specific rendering** as needed.

### Database Schema

**City Model** (server/models/City.js):

**Core Fields:**
- `name`, `country`, `location` (geospatial)
- `population`, `area`, `founded`, `timezone`
- `famousFor`, `trivia`, `color`

**Extended Fields:**
- `elevation`, `nickname`, `primaryLanguages`
- `currency`, `airportCodes`, `climateType`
- `mainIndustries`, `demonym`, `bestTimeToVisit`

### API Endpoints

**GET /api/cities**
- Returns all cities with complete data
- Transforms MongoDB geospatial format to lat/lng

**GET /api/cities/:name**
- Get single city by name
- Returns full city document

**GET /api/cities/near/:lng/:lat**
- Geospatial query for nearby cities
- Optional `maxDistance` query parameter
- Returns up to 10 nearest cities

### Troubleshooting

**MongoDB Connection Issues:**
```bash
# Check if MongoDB is running
lsof -Pi :27017 -sTCP:LISTEN

# Start MongoDB
brew services start mongodb-community  # macOS
sudo systemctl start mongod            # Linux
```

**Port Conflicts:**
```bash
# Kill process on port
lsof -ti:5173 | xargs kill -9  # Frontend
lsof -ti:3001 | xargs kill -9  # Backend
```

**Clean Slate Reset:**
```bash
npm run stop:all
mongosh globe-io --eval "db.cities.deleteMany({})"
npm start
```

**Scripts Not Executable:**
```bash
chmod +x bootstrap.sh teardown.sh
./bootstrap.sh
```

### Contributing

The project uses a clean, modular architecture:

1. **Views** are self-contained and easy to add
2. **Data fetching** is centralized in Globe.tsx
3. **API** is RESTful and well-documented
4. **Database** uses proper indexing and schemas

When adding features:
- Keep view logic separate
- Use TypeScript types
- Follow existing patterns
- Test with `npm start` before committing

### License

MIT

### Author

Built with [Claude Code](https://claude.com/claude-code)
