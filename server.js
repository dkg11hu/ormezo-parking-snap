// server.js - production-ready (patched)
'use strict';

const fs = require('fs');
const path = require('path');
const express = require('express');
const { spawn } = require('child_process');

let extractorRunning = false;
let child = null;

// Load local env in development only
if (process.env.NODE_ENV !== 'production') {
  try {
    require('dotenv').config({ path: '.env.local' });
  } catch (e) {
    console.warn('dotenv not available, skipping .env load');
  }
}

// Log build commit if available
let commit = process.env.COMMIT || null;
try {
  if (!commit && fs.existsSync('.commit')) {
    commit = fs.readFileSync('.commit', 'utf8').trim();
  }
} catch (e) { /* ignore */ }

console.log('STARTUP COMMIT:', commit || '<none>');
console.log('PID:', process.pid);

const app = express();
app.use(express.json());

// Simple request logger for key endpoints
app.use((req, res, next) => {
  if (req.path === '/parking-status.json' || req.path === '/admin/run-extractor') {
    console.log(`[server] ${new Date().toISOString()} ${req.method} ${req.path} from ${req.ip}`);
  }
  next();
});

// --- extractor runner ---
let extractor = null;


function runExtractor()
 {
  if (extractorRunning) {
    console.log('[server] extractor already running, skipping new run');
    return;
  }
  extractorRunning = true;

  child = spawn('node', ['extractor.js'], { stdio: ['ignore', 'pipe', 'pipe'] });

  child.stdout.on('data', (data) => {
    process.stdout.write('[extractor] ' + data.toString());
  });
  child.stderr.on('data', (data) => {
    process.stderr.write('[extractor ERR] ' + data.toString());
  });

  child.on('close', (code, signal) => {
    console.log(`[extractor] END code=${code} signal=${signal}`);
    extractorRunning = false;
    try {
      const filePath = path.join(__dirname, 'public', 'parking-status.json');
      const raw = fs.readFileSync(filePath, 'utf8');
      const items = JSON.parse(raw);

      const reportTime = new Date().toISOString().slice(0, 19).replace('T', ' ');
      const wrapped = {
        report_time: reportTime,
        items: items
      };
      fs.writeFileSync(filePath, JSON.stringify(wrapped, null, 2));
      console.log('[server] parking-status.json updated with report_time', reportTime);
    } catch (err) {
      console.error('[server] failed to wrap report_time:', err);
    }
  });
}


// Optional: run on startup if enabled via env
if (process.env.RUN_EXTRACTOR_ON_START === '1') {
  runExtractor();
}

// NEW: run extractor periodically every 5 minutes
setInterval(() => {
  console.log('[server] scheduled extractor run at', new Date().toISOString());
  runExtractor();
}, 5 * 60 * 1000);
// --- API routes (defined before static middleware) ---

// Health
app.get('/health', (req, res) => {
  const p = path.join(__dirname, 'public', 'parking-status.json');
  const ok = fs.existsSync(p);
  const mtime = ok ? fs.statSync(p).mtime.toISOString() : null;
  res.json({ status: ok ? 'ok' : 'not_ready', file_mtime: mtime });
});

// Root info
app.get('/', (req, res) => res.json({ message: 'ormezo-parking running', uptime: process.uptime() }));

// Friendly endpoints for extractor output (reads public files)
app.get('/parking-status.json', (req, res) => {
  const p = path.join(__dirname, 'public', 'parking-status.json');
  if (!fs.existsSync(p)) return res.status(404).json({ error: 'not ready' });
  try {
    const raw = fs.readFileSync(p, 'utf8');
    // Force no-cache so clients revalidate
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    return res.type('application/json').send(raw);
  } catch (e) {
    console.error('[parking-status] read error', e);
    return res.status(500).json({ error: 'read error' });
  }
});

app.get('/snapshot', (req, res) => {
  const p = path.join(__dirname, 'public', 'parking-status.json');
  if (!fs.existsSync(p)) return res.status(404).json([]);
  try {
    const raw = fs.readFileSync(p, 'utf8');
    return res.json(JSON.parse(raw));
  } catch (e) {
    console.error('[snapshot] read error', e);
    return res.status(500).json({ error: 'read error' });
  }
});

app.get('/live', (req, res) => {
  const p = path.join(__dirname, 'public', 'parking-status.json');
  if (!fs.existsSync(p)) return res.status(404).json([]);
  try {
    const raw = fs.readFileSync(p, 'utf8');
    return res.json(JSON.parse(raw));
  } catch (e) {
    console.error('[live] read error', e);
    return res.status(500).json({ error: 'read error' });
  }
});



// Admin endpoint to trigger extractor (protected by header secret)
app.post('/admin/run-extractor', async (req, res) => {
  const expected = process.env.EXTRACTOR_SECRET || '';
  // read secret from header 'x-extractor-secret'
  const incoming = (req.get('x-extractor-secret') || '').toString();

  if (!expected || incoming !== expected) {
    return res.status(403).json({ error: 'forbidden' });
  }

  try {
    runExtractor(); // start extractor (non-blocking)
    return res.json({ started: true });
  } catch (err) {
    console.error('[extractor] error', err);
    return res.status(500).json({ error: 'failed' });
  }
});

// --- explicit index.html route ---
// Serve index.html explicitly
app.get('/index.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Serve static files from public/ (after API routes) with no caching for safety
app.use(express.static(path.join(__dirname, 'public'), { maxAge: 0 }));

// Bind to port and host
const port = process.env.PORT || 3000;
const host = '0.0.0.0';
console.log('PORT:', process.env.PORT || '<none>', '-> listening on', port);

// start server once
const server = app.listen(port, host, () => {
  console.log(`Listening on ${port}`);
});

// handle listen errors (EADDRINUSE etc.)
server.on('error', (err) => {
  if (err && err.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use. Exiting.`);
    process.exit(1);
  }
  console.error('Server error', err);
  process.exit(1);
});

// graceful shutdown helper
const shutdown = (signal) => {
  console.log(`Received ${signal}, shutting down...`);
  server.close((err) => {
    if (err) {
      console.error('Error during server close', err);
      process.exit(1);
    }
    if (child && !child.killed) {
      try { child.kill('SIGINT'); } catch (e) { console.error('Error killing child process', e); }
  }

    console.log('Server closed');
    process.exit(0);
  });

  setTimeout(() => {
    console.error('Force exiting after timeout');
    process.exit(1);
  }, 10000).unref();
};

process.on('SIGINT', () => shutdown('SIGINT'));

//„graceful shutdown” logika kiegészítése
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, waiting for extractor...');
  if (extractorRunning) {
    child.on('close', () => {
      console.log('Extractor finished, shutting down server');
      server.close(() => process.exit(0));
    });
  } else {
    server.close(() => process.exit(0));
  }
});
