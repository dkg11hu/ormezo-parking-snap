// server.js - safer, serialized extractor runs, caching, explicit CORS
const express = require('express');
const cors = require('cors');
const { execFile } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const fs = require('fs').promises;

const execFileAsync = promisify(execFile);

const app = express();
const PORT = process.env.PORT || 3000;
const ROOT = path.resolve(__dirname, '..');
const JSON_PATH = path.join(ROOT, 'parking-status.json');
const EXTRACTOR = path.join(ROOT, 'extractor.js');
const EXTRACT_TIMEOUT_MS = 20_000; // 20s

// Restrict CORS to known origins in production
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:5500'];
app.use(cors({
  origin: function(origin, cb) {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    cb(new Error('Not allowed by CORS'));
  }
}));

// Simple in-memory cache and run lock
let cached = null;
let lastUpdated = 0;
let extractorRunning = false;
let lastRunError = null;

async function runExtractor() {
  if (extractorRunning) return; // already running
  extractorRunning = true;
  lastRunError = null;
  try {
    // execFile avoids shell interpolation
    await execFileAsync('node', [EXTRACTOR], { cwd: ROOT, timeout: EXTRACT_TIMEOUT_MS, maxBuffer: 10 * 1024 * 1024 });
    const content = await fs.readFile(JSON_PATH, 'utf8');
    cached = JSON.parse(content);
    lastUpdated = Date.now();
  } catch (err) {
    lastRunError = err;
    console.error('Extractor error:', err);
    throw err;
  } finally {
    extractorRunning = false;
  }
}

// Public endpoint returns cached JSON if fresh, otherwise runs extractor (serialized)
app.get('/api/status', async (req, res) => {
  try {
    const CACHE_TTL_MS = 5_000; // serve cached result for 5s to avoid frequent runs
    const now = Date.now();

    if (cached && (now - lastUpdated) < CACHE_TTL_MS) {
      return res.json(cached);
    }

    // If extractor is already running, wait for it to finish (with timeout)
    if (extractorRunning) {
      const waitStart = Date.now();
      while (extractorRunning && (Date.now() - waitStart) < EXTRACT_TIMEOUT_MS) {
        await new Promise(r => setTimeout(r, 100));
      }
      if (cached) return res.json(cached);
      if (lastRunError) throw lastRunError;
    }

    // Run extractor and return fresh data
    await runExtractor();
    return res.json(cached);
  } catch (err) {
    console.error('Failed to produce status:', err);
    return res.status(500).json({ error: 'Failed to produce status' });
  }
});

// Optional admin endpoint to force regeneration (protect in production)
app.post('/api/admin/regen', express.json(), async (req, res) => {
  // Add auth check here in production
  try {
    await runExtractor();
    return res.json({ ok: true, updated: lastUpdated });
  } catch (err) {
    return res.status(500).json({ error: 'Regeneration failed' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend API running on port ${PORT}`);
});
