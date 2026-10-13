const express = require('express');
const cors = require('cors');
const apiRoutes = require('../src/routes/api');

const app = express();

app.use(cors());
app.use(express.json());

// Normalize URLs when running as Vercel serverless functions
app.use((req, res, next) => {
  const urlObj = new URL(req.url, 'http://localhost');
  const pathParam = urlObj.searchParams.get('__path');

  if (pathParam) {
    urlObj.searchParams.delete('__path');
    const remainingQuery = urlObj.searchParams.toString();
    const cleanPath = pathParam.startsWith('/') ? pathParam : `/${pathParam}`;
    req.url = remainingQuery ? `${cleanPath}?${remainingQuery}` : cleanPath;
  } else if (req.headers['x-matched-path']) {
    req.url = req.headers['x-matched-path'];
  } else if (req.headers['x-vercel-matched-path']) {
    req.url = req.headers['x-vercel-matched-path'];
  }

  // Strip redundant file prefix if present
  if (req.url.startsWith('/api/index.js')) {
    req.url = req.url.replace('/api/index.js', '') || '/';
  } else if (req.url.startsWith('/index.js')) {
    req.url = req.url.replace('/index.js', '') || '/';
  }

  next();
});

// Mount API routes for both rewritten and direct paths
app.use('/api', apiRoutes);
app.use('/', apiRoutes);

// Fallback health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'CivicEase Agentic API Serverless Function is running.' });
});

module.exports = app;
