// server.js - production-ready
'use strict';

const fs = require('fs');
const path = require('path');
const express = require('express');
const { spawn } = require('child_process');

const incoming = (req.get('x-run-secret') || '').trim();
console.log(`[admin] incoming x-run-secret: ${incoming ? incoming.slice(0,4) + '...' : 'none'}`);


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

// Serve static files from public/
app.use(express.static(path.join(__dirname, 'public')));

// --- extractor runner (inserted) ---
let extractor = null;

function runExtractor() {
  if (extractor && !extractor.killed) {
    console.log('Extractor already running, skipping new run');
    return;
  }
  console.log('Spawning extractor...');
  extractor = spawn('node', [path.join(__dirname, 'extractor.js')], {
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env }
  });

  extractor.stdout.on('data', (d) => console.log('[extractor]', d.toString().trim()));
  extractor.stderr.on('data', (d) => console.error('[extractor ERR]', d.toString().trim()));
  extractor.on('exit', (code, signal) => {
    console.log(`extractor exited code=${code} signal=${signal}`);
    extractor = null;
  });
}

// Optional: run on startup if enabled via env
if (process.env.RUN_EXTRACTOR_ON_START === '1') {
  runExtractor();
}

// Manual trigger (protected by EXTRACTOR_SECRET header)
app.post('/admin/run-extractor', async (req, res) => {
  // Masked debug: logs only first 4 chars if header present
  const incoming = (req.get('x-run-secret') || '').trim();
  console.log(`[admin] incoming x-run-secret: ${incoming ? incoming.slice(0,4) + '...' : 'none'}`);

  // Normal secret check (example)
  const expected = process.env.EXTRACTOR_SECRET || '';
  if (!incoming || incoming !== expected) {
    return res.status(403).json({ error: 'forbidden' });
  }

  // Start extractor (your existing logic goes here)
  try {
    // await runExtractor();
    return res.json({ started: true });
  } catch (err) {
    console.error('[extractor] error', err);
    return res.status(500).json({ error: 'failed' });
  }
});
// --- end extractor runner ---

// routes
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', time: new Date().toISOString() });
});

app.get('/', (req, res) => res.json({ message: 'ormezo-parking running', uptime: process.uptime() }));

// Friendly endpoints for extractor output (reads public files)
app.get('/parking-status.json', (req, res) => {
  const p = path.join(__dirname, 'public', 'parking-status.json');
  if (!fs.existsSync(p)) return res.status(404).json({ error: 'not ready' });
  try {
    const raw = fs.readFileSync(p, 'utf8');
    return res.type('application/json').send(raw);
  } catch (e) {
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
    return res.status(500).json({ error: 'read error' });
  }
});

// Bind to Render-provided port and host
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
    if (extractor && !extractor.killed) {
      try { extractor.kill('SIGINT'); } catch (e) { console.error('Error killing child process', e); }
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
process.on('SIGTERM', () => shutdown('SIGTERM'));
