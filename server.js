const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./src/config/config');
const apiRoutes = require('./src/routes/api');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Serve static frontend assets from public/ directory
app.use(express.static(path.join(__dirname, 'public')));

// Mount API routes
app.use('/api', apiRoutes);

// Fallback to customer portal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Express Server
app.listen(config.port, () => {
  console.log(`=======================================================`);
  console.log(`CivicEase Agentic AI Server running on http://localhost:${config.port}`);
  console.log(`- Customer Portal:  http://localhost:${config.port}/index.html`);
  console.log(`- Retailer Portal:  http://localhost:${config.port}/retailer.html`);
  console.log(`=======================================================`);
});
