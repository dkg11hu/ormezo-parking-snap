// server.js - production-ready
'use strict';

const fs = require('fs');
const express = require('express');
const fs = require(\"fs\");
let commit = process.env.COMMIT || null;
try { if (!commit && fs.existsSync(\".commit\")) { commit = fs.readFileSync(\".commit\", \"utf8\").trim(); } } catch (e) {}
console.log(\"STARTUP COMMIT:\", commit || \"<none>\");
const { spawn } = require('child_process');

// Load local env in development only
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ path: '.env.local' });
}

// Log build commit if available
let commit = process.env.COMMIT || null;
try {
  if (!commit && fs.existsSync('.commit')) {
    commit = fs.readFileSync('.commit', 'utf8').trim();
  }
} catch (e) { /* ignore */ }

const app = express();
app.use(express.json());

// Validate required secrets (adjust names as needed)
const requiredEnv = ['PRIVATE_KEY', 'PUBLIC_KEY'];
const missing = requiredEnv.filter((k) => !process.env[k]);
if (missing.length) {
  console.error('Missing required environment variables:', missing.join(', '));
  process.exit(1);
}

console.log('STARTUP COMMIT:', commit || '<none>');

let extractor = null; // optional child process

// routes
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', time: new Date().toISOString() });
});

app.get('/', (req, res) => res.json({ message: 'ormezo-parking running', uptime: process.uptime() }));

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

// Example: spawn a child process and forward signals
// extractor = spawn('node', ['extractor.js'], { stdio: 'inherit' });
// process.on('SIGINT', () => extractor && extractor.kill('SIGINT'));
// process.on('SIGTERM', () => extractor && extractor.kill('SIGTERM'));
