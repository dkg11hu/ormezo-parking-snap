const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

app.get('/api/status', (req, res) => {
  const jsonPath = path.resolve(__dirname, '../parking-status.json');

  exec('node extractor.js', { cwd: path.resolve(__dirname, '..') }, (err) => {
    if (err) {
      console.error("Extractor failed:", err);
      return res.status(500).json({ error: 'Extractor failed' });
    }

    // Read the file fresh each time
    fs.readFile(jsonPath, 'utf8', (readErr, content) => {
      if (readErr) {
        console.error("Could not read output JSON:", readErr);
        return res.status(500).json({ error: 'Could not read output JSON' });
      }
      try {
        const data = JSON.parse(content);
        res.json(data);
      } catch (parseErr) {
        console.error("Invalid JSON:", parseErr);
        res.status(500).json({ error: 'Invalid JSON format' });
      }
    });
  });
});

app.listen(PORT, () => {
  console.log(`Backend API running on port ${PORT}`);
});
