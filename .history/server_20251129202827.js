// server.js - patched version
// Loads dotenv in development, validates required env vars,
// exposes a JSON /health endpoint, spawns optional child process,
// binds to Render's port, and handles graceful shutdown.

'use strict';

const express = require('express');
const { spawn } = require('child_process');

// Load local env in development only
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ path: '.env.local' });
}

// log of commit 
const fs = require('fs');
let commit = process.env.COMMIT || null;
try {
  if (!commit && fs.existsSync('.commit')) {
    commit = fs.readFileSync('.commit', 'utf8').trim();
  }
} catch (e) {
  /* ignore */
}
console.log('STARTUP COMMIT:', commit || '<none>');

const app = express();

// Optional: parse JSON bodies if you have APIs
app.use(express.json());

// Validate required secrets (adjust names as needed)
const requiredEnv = ['PRIVATE_KEY', 'PUBLIC_KEY'];
const missing = requiredEnv.filter((k) => !process.env[k]);
if (missing.length) {
  console.error('Missing required environment variables:', missing.join(', '));
  // Exit so the service fails fast in environments without secrets
  process.exit(1);
}

let extractor = null; // example child process if you need one

// routes
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', time: new Date().toISOString() });
});

app.get('/', (req, res) => res.json({ message: 'ormezo-parking running', uptime: process.uptime() }));

// Bind to Render-provided port and host
const port = process.env.PORT || 3000;
const host = '0.0.0.0';

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
  // stop accepting new connections
  server.close((err) => {
    if (err) {
      console.error('Error during server close', err);
      process.exit(1);
    }
    // kill child if running
    if (extractor && !extractor.killed) {
      try {
        extractor.kill('SIGINT');
      } catch (e) {
        console.error('Error killing child process', e);
      }
    }
    console.log('Server closed');
    process.exit(0);
  });

  // force exit if close hangs
  setTimeout(() => {
    console.error('Force exiting after timeout');
    process.exit(1);
  }, 10000).unref();
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

// Example: spawn a child process and forward signals
// Uncomment and adapt if you actually use extractor.js
// extractor = spawn('node', ['extractor.js'], { stdio: 'inherit' });
// process.on('SIGINT', () => extractor && extractor.kill('SIGINT'));
// process.on('SIGTERM', () => extractor && extractor.kill('SIGTERM'));
