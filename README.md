# Globe.io

An interactive 3D globe visualization showcasing major cities around the world with interesting trivia and facts.

![Globe.io Screenshot](screenshot.png)

## Features

- Interactive 3D globe built with Three.js and react-globe.gl
- 30 major cities from around the world
- Comprehensive city data including population, area, founding date, timezone, and famous landmarks
- Click on city markers to learn detailed information
- Hover tooltips with quick city stats
- Smooth camera animations when selecting cities
- Beautiful night-themed globe with atmospheric effects

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn

### Quick Start (Recommended)

The easiest way to get started is using the bootstrap script:

```bash
npm run bootstrap
```

This script will automatically:
- ✅ Check if MongoDB is running (start it if needed)
- ✅ Install all dependencies
- ✅ Create and seed the database
- ✅ Start the backend API server
- ✅ Start the frontend development server

Then open [http://localhost:5173](http://localhost:5173) in your browser.

### Manual Setup

If you prefer to set things up manually:

#### 1. Install MongoDB

**macOS:**
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get install mongodb
sudo systemctl start mongod
```

**Windows:**
Download from [MongoDB Download Center](https://www.mongodb.com/try/download/community)

#### 2. Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server && npm install
```

#### 3. Seed Database

```bash
npm run seed
```

#### 4. Start Development Servers

In one terminal:
```bash
npm run dev:server
```

In another terminal:
```bash
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173) in your browser.

## 🔄 Lifecycle Management

### Starting the Application

**Simple Start (Recommended):**
```bash
npm start
```

The bootstrap script intelligently:
1. ✅ Checks if Node.js and MongoDB are installed
2. ✅ Installs dependencies (if not already installed)
3. ✅ Detects if MongoDB is running → Starts it if needed
4. ✅ Checks if database has data → Seeds only if empty
5. ✅ Detects if backend is running → Starts only if needed (port 5000)
6. ✅ Detects if frontend is running → Starts only if needed (port 5173)
7. ✅ **If everything is already running → Does nothing (no-op)**

**What makes it smart:**
- Run it 10 times = same result (idempotent)
- Crashed backend? Just run `npm start` to restart it
- Already running? It just reports status
- Clean machine? It sets up everything automatically

### Stopping the Application

**Stop Development Servers:**
```bash
npm stop
```
- Stops frontend (port 5173)
- Stops backend (port 5000)
- **Keeps MongoDB running** (faster restart)
- **Preserves all data**

**Stop Everything (Including Database):**
```bash
npm run stop:all
```
- Stops frontend
- Stops backend
- Stops MongoDB
- **Still preserves all data** (just stops the process)

**Safety Features:**
- Graceful shutdown (5-second timeout)
- Force kill if process doesn't stop
- Never deletes data
- Shows status summary after teardown

### Common Workflows

**First Time Setup:**
```bash
git clone https://github.com/bharat94/globe.io.git
cd globe.io
npm start
# ✅ Everything set up automatically!
```

**Daily Development:**
```bash
# Morning
npm start  # Starts what's needed, skips what's already running

# Working...

# Evening
npm stop   # Stops servers, keeps MongoDB for faster restart
```

**Complete Reset (Rare):**
```bash
npm run stop:all  # Stop everything
npm start         # Fresh start
```

**Restart Services:**
```bash
npm stop && npm start
```

### Available Scripts

**Lifecycle:**
- `npm start` or `npm run bootstrap` - Smart bootstrap (starts everything)
- `npm stop` - Stop frontend & backend (keeps MongoDB & data)
- `npm run stop:all` - Stop everything including MongoDB (keeps data)

**Development:**
- `npm run dev` - Start frontend development server only
- `npm run dev:server` - Start backend API server only
- `npm run seed` - Seed MongoDB database with city data

**Build:**
- `npm run build` - Build frontend for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🏗️ Architecture

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
│  - Globe.gl 3D visualization                            │
│  - Day/night mode toggle                                │
│  - City detail panels                                   │
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
│  Port: 5000                                             │
└─────────────────────────────────────────────────────────┘
                           │
                           │ Mongoose ODM
                           ↓
┌─────────────────────────────────────────────────────────┐
│                MongoDB Database                          │
│  Database: globe-io                                     │
│  Collection: cities (30 documents)                      │
│  - Geospatial indexes (2dsphere)                        │
│  - Document structure matches City schema               │
│  Port: 27017                                            │
└─────────────────────────────────────────────────────────┘
```

## 🛠️ Troubleshooting

### MongoDB Issues

**"MongoDB connection refused"**
```bash
# Check if MongoDB is running
lsof -Pi :27017 -sTCP:LISTEN

# Start MongoDB manually
# macOS:
brew services start mongodb-community

# Linux:
sudo systemctl start mongod
```

**"Database not seeding"**
```bash
# Manually seed the database
npm run seed

# Check database
mongosh
> use globe-io
> db.cities.countDocuments()  // Should return 30
```

### Port Conflicts

**"Port 5173 already in use"**
```bash
# Find and kill the process
lsof -ti:5173 | xargs kill -9
```

**"Port 5000 already in use"**
```bash
# Find and kill the process
lsof -ti:5000 | xargs kill -9
```

### General Issues

**"npm start does nothing"**
```bash
# Make scripts executable
chmod +x bootstrap.sh teardown.sh

# Run directly
./bootstrap.sh
```

**"Backend can't connect to MongoDB"**
```bash
# Check MongoDB is running
brew services list | grep mongodb

# Check connection string
cat server/.env  # Should have MONGODB_URI=mongodb://localhost:27017/globe-io
```

**Clean Slate Reset:**
```bash
# Stop everything
npm run stop:all

# Clear database (optional - will be re-seeded)
mongosh globe-io --eval "db.cities.deleteMany({})"

# Fresh start
npm start
```

## Technologies Used

### Frontend
- React 18
- TypeScript
- Vite
- react-globe.gl
- Three.js

### Backend
- Node.js & Express
- MongoDB with Mongoose
- RESTful API
- Geospatial indexing for location queries

### DevOps
- Smart bootstrap script (automatic setup)
- Graceful teardown script (safe shutdown)
- Idempotent operations (run multiple times safely)

## How to Use

1. Drag the globe to rotate and explore
2. Scroll to zoom in/out
3. Click on any city marker to view detailed information
4. Hover over markers to see quick info

## Cities Featured

Explore 30 major cities from around the world:

**Asia-Pacific:**
- Tokyo, Japan
- Beijing, China
- Shanghai, China
- Seoul, South Korea
- Singapore
- Bangkok, Thailand
- Jakarta, Indonesia
- Mumbai, India
- Delhi, India
- Sydney, Australia
- Melbourne, Australia

**Americas:**
- New York, USA
- Los Angeles, USA
- Toronto, Canada
- Mexico City, Mexico
- São Paulo, Brazil
- Rio de Janeiro, Brazil
- Buenos Aires, Argentina

**Europe:**
- London, UK
- Paris, France
- Berlin, Germany
- Rome, Italy
- Madrid, Spain
- Barcelona, Spain
- Amsterdam, Netherlands
- Moscow, Russia

**Middle East & Africa:**
- Dubai, UAE
- Istanbul, Turkey
- Cairo, Egypt
- Lagos, Nigeria
