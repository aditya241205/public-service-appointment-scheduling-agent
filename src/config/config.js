const path = require('path');
const dns = require('dns');

// Enforce IPv4-first DNS resolution to avoid Node.js IPv6 connect timeouts on Windows
dns.setDefaultResultOrder('ipv4first');

require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

module.exports = {
  port: process.env.PORT || 3000,
  groqApiKey: process.env.GROQ_API_KEY,
  groqModel: process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
  groqApiUrl: 'https://api.groq.com/openai/v1/chat/completions',
  dataPath: path.join(__dirname, '..', 'data', 'store.json')
};
