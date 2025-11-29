// server.js
// Safer, serialized extractor runs, caching, explicit CORS, health, graceful shutdown
const express = require('express');
const cors = require('cors');
const { execFile } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const fs = require('fs').promises;

const execFileAsync = promisify(execFile);

const app = express();
const PORT = Number(process.env.PORT || 3000);
const ROOT = path.resolve(__dirname, '..');
const JSON_PATH = path.join(ROOT, 'parking-status.json');
const EXTRACTOR = path.join(ROOT, 'extractor.js');
const EXTRACT_TIMEOUT_MS = Number(process.env.EXTRACT_TIMEOUT_MS || 20_000); // 20s default
const CACHE_TTL_MS = Number(process.env.CACHE_TTL_MS || 5_000); // 5s default

// CORS: allow no-origin (curl/server) and local dev hosts by default.
// Set ALLOWED_ORIGINS env var to a comma-separated list for production.
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim())
  : ['http://localhost:5500', 'http://127.0.0.1:5500'];

app.use(cors({
  origin: function(origin, callback) {
    // allow requests with no origin (curl, server-side)
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  }
}));

// Basic request logging (lightweight)
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} - ${ms}ms`);
  });
  next();
});

// In-memory cache + run lock
let cached = null;
let lastUpdated = 0;
let extractorRunning = false;
let lastRunError = null;

async function runExtractor() {
  if (extractorRunning) return; // already running; caller will wait
  extractorRunning = true;
  lastRunError = null;
  try {
    // execFile avoids shell interpolation; pass node and script path
    await execFileAsync('node', [EXTRACTOR], {
      cwd: ROOT,
      timeout: EXTRACT_TIMEOUT_MS,
      maxBuffer: 10 * 1024 * 1024
    });

    // Read and parse the JSON output
    const content = await fs.readFile(JSON_PATH, 'utf8');
    cached = JSON.parse(content);
    lastUpdated = Date.now();
    console.log('Extractor finished, cache updated.');
  } catch (err) {
    lastRunError = err;
    console.error('Extractor error:', err);
    throw err;
  } finally {
    extractorRunning = false;
  }
}

// Wait helper with timeout
function waitForExtractor(timeoutMs) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    (function poll() {
      if (!extractorRunning) return resolve();
      if (Date.now() - start > timeoutMs) return reject(new Error('Extractor wait timeout'));
      setTimeout(poll, 100);
    })();
  });
}

// Public endpoint: return cached JSON if fresh, otherwise run extractor (serialized)
app.get('/api/status', async (req, res) => {
  try {
    const now = Date.now();

    if (cached && (now - lastUpdated) < CACHE_TTL_MS) {
      return res.json(cached);
    }

    if (extractorRunning) {
      // wait for current run to finish (bounded)
      try {
        await waitForExtractor(EXTRACT_TIMEOUT_MS);
      } catch (err) {
        console.warn('Waiting for extractor timed out:', err.message);
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

// Admin endpoint to force regeneration (add auth in production)
app.post('/api/admin/regen', express.json(), async (req, res) => {
  // In production, validate a token or other auth here:
  // if (req.headers['x-admin-token'] !== process.env.ADMIN_TOKEN) return res.status(401).json({ error: 'Unauthorized' });

  try {
    await runExtractor();
    return res.json({ ok: true, updated: lastUpdated });
  } catch (err) {
    return res.status(500).json({ error: 'Regeneration failed' });
  }
});

// Health and readiness endpoints
app.get('/health', (req, res) => res.json({ status: 'ok', uptime: process.uptime() }));
app.get('/ready', (req, res) => {
  // ready if we have cached data or extractor is not failing repeatedly
  if (cached) return res.json({ ready: true, lastUpdated });
  if (lastRunError) return res.status(503).json({ ready: false, error: String(lastRunError) });
  return res.status(503).json({ ready: false });
});

// Graceful shutdown
let shuttingDown = false;
async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`Received ${signal}, shutting down...`);
  // stop accepting new connections
  server.close(() => {
    console.log('HTTP server closed.');
  });
  // wait for extractor to finish (bounded)
  if (extractorRunning) {
    try {
      await waitForExtractor(10_000);
      console.log('Extractor finished before shutdown.');
    } catch {
      console.warn('Extractor did not finish in time; exiting anyway.');
    }
  }
  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  shutdown('uncaughtException');
});
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`Backend API running on port ${PORT}`);
});

// Export app for tests or external use
module.exports = app;
