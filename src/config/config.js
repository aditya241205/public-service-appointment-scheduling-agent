const path = require('path');
const dns = require('dns');

try {
  dns.setDefaultResultOrder('ipv4first');
} catch (e) {}

require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const isVercel = Boolean(process.env.VERCEL);

module.exports = {
  port: process.env.PORT || 3000,
  groqApiKey: process.env.GROQ_API_KEY,
  groqModel: process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
  groqApiUrl: 'https://api.groq.com/openai/v1/chat/completions',
  dataPath: isVercel
    ? path.join('/tmp', 'store.json')
    : path.join(__dirname, '..', 'data', 'store.json')
};
