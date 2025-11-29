const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const server = app.listen(port, '0.0.0.0', () => {
  console.log(`Listening on ${port}`);
});


const shutdown = (signal) => {
  console.log(`Received ${signal}, shutting down...`);
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000).unref();
};

process.on('SIGINT', () => shutdown('SIGINT'));

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use. Exiting.`);
    process.exit(1);
  }
  console.error('Server error', err);
  process.exit(1);
});

process.on('SIGTERM', () => shutdown('SIGTERM'));

const shutdown = (signal) => {
  console.log(`Received ${signal}, shutting down...`);
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
  // force exit after timeout
  setTimeout(() => process.exit(1), 10000).unref();
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));


app.get('/health', (req, res) => res.send('OK'));
app.get('/', (req, res) => res.json({ message: 'ormezo-parking running' }));

app.listen(port, '0.0.0.0', () => {
  console.log(`Listening on ${port}`);

});
