const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.get('/health', (req, res) => res.send('OK'));
app.get('/', (req, res) => res.json({ message: 'ormezo-parking running' }));

app.listen(port, '0.0.0.0', () => {
  console.log(`Listening on ${port}`);

});
