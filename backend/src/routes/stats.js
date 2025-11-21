const express = require('express');
const fs = require('fs').promises;
const fsWatch = require('fs');
const path = require('path');
const router = express.Router();
const DATA_PATH = path.join(__dirname, '../../../data/items.json');

// Cache for stats
let statsCache = {
  stats: null,
  fileMtime: null,
  isCalculating: false
};

// Calculate stats from items
async function calculateStats(items) {
  // Intentional heavy CPU calculation
  const total = items.length;
  const averagePrice = items.length > 0
    ? items.reduce((acc, cur) => acc + cur.price, 0) / items.length
    : 0;
  
  return {
    total,
    averagePrice: Math.round(averagePrice * 100) / 100 // Round to 2 decimal places
  };
}

// Get file modification time
async function getFileMtime() {
  try {
    const stats = await fs.stat(DATA_PATH);
    return stats.mtime.getTime();
  } catch (error) {
    return null;
  }
}

// Load and calculate stats (with caching)
async function getStats() {
  // Check if file has changed
  const currentMtime = await getFileMtime();
  
  // If cache is valid and file hasn't changed, return cached stats
  if (statsCache.stats && statsCache.fileMtime === currentMtime) {
    return statsCache.stats;
  }

  // Prevent concurrent calculations
  if (statsCache.isCalculating) {
    // Wait a bit and retry
    await new Promise(resolve => setTimeout(resolve, 100));
    if (statsCache.stats && statsCache.fileMtime === currentMtime) {
      return statsCache.stats;
    }
  }

  // Calculate new stats
  statsCache.isCalculating = true;
  try {
    const raw = await fs.readFile(DATA_PATH, 'utf8');
    const items = JSON.parse(raw);
    const stats = await calculateStats(items);
    
    // Update cache
    statsCache.stats = stats;
    statsCache.fileMtime = currentMtime;
    
    return stats;
  } catch (error) {
    // Better error message with resolved path
    console.error(`Error reading data file from: ${DATA_PATH}`);
    console.error(`Current __dirname: ${__dirname}`);
    throw error;
  } finally {
    statsCache.isCalculating = false;
  }
}

// Watch file for changes and invalidate cache
fsWatch.watchFile(DATA_PATH, { interval: 1000 }, async (curr, prev) => {
  if (curr.mtime.getTime() !== prev.mtime.getTime()) {
    // File changed, invalidate cache
    statsCache.fileMtime = null;
    statsCache.stats = null;
    console.log('Items file changed, stats cache invalidated');
  }
});

// GET /api/stats
router.get('/', async (req, res, next) => {
  try {
    const stats = await getStats();
    res.json(stats);
  } catch (err) {
    next(err);
  }
});

module.exports = router;