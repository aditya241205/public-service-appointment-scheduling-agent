const express = require('express');
const cors = require('cors');
const apiRoutes = require('../src/routes/api');

const app = express();

app.use(cors());
app.use(express.json());

// Mount API routes for both rewritten and direct paths
app.use('/api', apiRoutes);
app.use('/', apiRoutes);

// Fallback health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'CivicEase Agentic API Serverless Function is running.' });
});

module.exports = app;
