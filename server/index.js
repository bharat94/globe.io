const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const citiesRouter = require('./routes/cities');
const weatherRouter = require('./routes/weather');
const populationRouter = require('./routes/population');
const earthquakesRouter = require('./routes/earthquakes');
const satellitesRouter = require('./routes/satellites');
const pollutionRouter = require('./routes/pollution');
const flightsRouter = require('./routes/flights');
const auroraRouter = require('./routes/aurora');

const app = express();
const PORT = process.env.PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/globe-io';

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  });

// Routes
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

app.use('/api/cities', citiesRouter);
app.use('/api/weather', weatherRouter);
app.use('/api/population', populationRouter);
app.use('/api/earthquakes', earthquakesRouter);
app.use('/api/satellites', satellitesRouter);
app.use('/api/pollution', pollutionRouter);
app.use('/api/flights', flightsRouter);
app.use('/api/aurora', auroraRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Database: ${MONGODB_URI}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await mongoose.connection.close();
  process.exit(0);
});
