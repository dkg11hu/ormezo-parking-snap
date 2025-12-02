const express = require('express');
const { spawn } = require('child_process');

const app = express();
const port = process.env.PORT || 3000;

let extractor = null; // example child process if you need one

// routes
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', time: new Date().toISOString() });
});

app.get('/', (req, res) => res.json({ message: 'ormezo-parking running' }));

// start server once
const server = app.listen(port, '0.0.0.0', () => {
  console.log(`Listening on ${port}`);
});

// handle listen errors (EADDRINUSE etc.)
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
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
      extractor.kill('SIGINT');
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
