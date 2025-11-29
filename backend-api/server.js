const express = require('express');
const { exec } = require('child_process');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/api/status', (req, res) => {
  exec('node extractor.js', { cwd: path.resolve(__dirname, '..') }, (err) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Extractor failed' });
    }
    try {
      const data = require(path.resolve(__dirname, '../parking-status.json'));
      res.json(data);
    } catch (e) {
      res.status(500).json({ error: 'Could not read output JSON' });
    }
  });
});

app.listen(PORT, () => {
  console.log(`Backend API running on port ${PORT}`);
});
