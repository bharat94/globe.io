# Data Ingestion Guide

Tools and strategies for populating Globe.io with data.

## Overview

Globe.io uses a hybrid data strategy:
- **Pre-ingested data** (MongoDB) for fast, predictable access
- **Live API calls** (cached) for high-resolution or on-demand data

| Data Type | Source | Strategy |
|-----------|--------|----------|
| Temperature | Open-Meteo API | Pre-ingested (10°, 5°, 2.5°) + live (finer) |
| Population | World Bank API | Pre-ingested (all years) |
| Demographics | World Bank API | Live on click |
| Cities | Static JSON | Bundled with code |

## Ingestion CLI

Located at `server/ingestion/index.js`:

```bash
cd server
node ingestion/index.js <command> [options]
```

### Commands

**Ingest data:**
```bash
node ingestion/index.js ingest \
  --type temperature \
  --resolution 10 \
  --year-start 2000 \
  --year-end 2024
```

Options:
- `-t, --type <type>` - Data type (required): `temperature`
- `-r, --resolution <number>` - Grid resolution in degrees (required): `10`, `5`, `2.5`, `2`, `1`, `0.5`
- `-ys, --year-start <year>` - Start year (default: 2000)
- `-ye, --year-end <year>` - End year (default: 2024)
- `--dry-run` - Preview without making API calls
- `--resume <jobId>` - Resume a paused/failed job

**List jobs:**
```bash
node ingestion/index.js jobs list
node ingestion/index.js jobs list --status paused
node ingestion/index.js jobs list --type temperature --limit 5
```

**Job status:**
```bash
node ingestion/index.js jobs status <jobId>
```

**View statistics:**
```bash
node ingestion/index.js stats --type temperature
```

## Temperature Ingestion

### Resolution Grid Sizes

| Resolution | Grid Points | Records/Year | Total (25 yrs) |
|------------|-------------|--------------|----------------|
| 10° | 648 | 7,776 | 194,400 |
| 5° | 2,592 | 31,104 | 777,600 |
| 2.5° | 10,368 | 124,416 | 3,110,400 |

### API Quotas (Open-Meteo Free Tier)

- **Daily limit:** 10,000 requests
- **Safe limit:** 9,000 requests (buffer for retries)
- **Batch size:** 100 coordinates per request

**Ingestion time estimates:**

| Resolution | API Calls | Days Required |
|------------|-----------|---------------|
| 10° | ~195 | < 1 day |
| 5° | ~778 | < 1 day |
| 2.5° | ~3,110 | 1 day |
| All 3 | ~4,083 | 1 day |

### Running Full Ingestion

```bash
# Recommended: Start with coarse resolution
node ingestion/index.js ingest -t temperature -r 10 -ys 2000 -ye 2024

# Then finer resolutions (can run next day to respect quota)
node ingestion/index.js ingest -t temperature -r 5 -ys 2000 -ye 2024
node ingestion/index.js ingest -t temperature -r 2.5 -ys 2000 -ye 2024
```

### Resuming Failed Jobs

Jobs checkpoint progress monthly. To resume:

```bash
# Find the job ID
node ingestion/index.js jobs list --status paused

# Resume it
node ingestion/index.js ingest -t temperature -r 10 --resume <jobId>
```

### Graceful Shutdown

Press `Ctrl+C` during ingestion to:
1. Finish current batch
2. Save checkpoint
3. Mark job as paused

Resume anytime with `--resume`.

## Population Ingestion

Population data is seeded via a separate script:

```bash
cd server
npm run seed:population
```

This fetches from World Bank API:
- 89 countries with geographic coordinates
- Years 1960-2023
- ~5,700 total records

**Note:** Demographics (gender, age, urban/rural) are fetched live on country click to keep the database lean.

## Database Management

### Checking Data

```bash
# From mongo shell
mongosh globe-io

# Count temperature records
db.temperaturedatas.countDocuments()

# Check by resolution
db.temperaturedatas.aggregate([
  { $group: { _id: "$resolution", count: { $sum: 1 } } }
])

# Check population records
db.populationdatas.countDocuments()
```

### Clearing Data

```bash
# Clear all temperature data (to re-ingest)
mongosh globe-io --eval "db.temperaturedatas.deleteMany({})"

# Clear specific resolution
mongosh globe-io --eval "db.temperaturedatas.deleteMany({ resolution: 10 })"

# Clear ingestion jobs
mongosh globe-io --eval "db.ingestionjobs.deleteMany({})"
```

## Adding New Data Types

1. **Create ingester** in `server/ingestion/ingesters/`:
   ```javascript
   class YourDataIngester extends BaseIngester {
     async processMonth(year, month, grid) {
       // Fetch from API, return data points
     }
   }
   ```

2. **Register** in `server/ingestion/index.js`:
   ```javascript
   case 'yourdata':
     return new YourDataIngester();
   ```

3. **Add to config** in `server/ingestion/config.js`:
   ```javascript
   DATA_TYPES: ['temperature', 'yourdata'],
   ```

4. **Create model** in `server/models/YourData.js`

## Troubleshooting

**Rate limited (429 errors):**
- Wait for quota reset (midnight UTC)
- Job will auto-resume from checkpoint

**Job stuck:**
```bash
# Check status
node ingestion/index.js jobs status <jobId>

# If truly stuck, can reset and retry
mongosh globe-io --eval "db.ingestionjobs.updateOne(
  { jobId: '<jobId>' },
  { \$set: { status: 'paused' } }
)"
```

**Missing data for specific year/month:**
- Check if job completed: `jobs status <jobId>`
- Re-run with specific year range if needed

**Database too large:**
- Consider keeping only recent years (e.g., 2010-2024)
- Use coarser resolution for older data
