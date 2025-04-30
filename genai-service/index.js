// index.js
require('dotenv').config();
const cors = require('cors');
const axios = require('axios');

// Create a CORS middleware with permissive origin
const corsHandler = cors({ origin: true });

exports.generate = (req, res) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).send('');
  }

  // Apply CORS middleware to actual request
  corsHandler(req, res, async () => {
    if (req.method !== 'POST') {
      res.set('Access-Control-Allow-Origin', '*');
      return res.status(405).send('Only POST allowed');
    }

    const { prompt } = req.body || {};
    if (!prompt) {
      res.set('Access-Control-Allow-Origin', '*');
      return res.status(400).json({ error: 'Missing prompt in request body' });
    }

    try {
      const resp = await axios.post(
        'https://api.openai.com/v1/images/generations',
        { prompt, n: 1, size: '1024x1024' },
        { headers: { Authorization: `Bearer ${process.env.GENAI_API_KEY}` } }
      );
      const url = resp.data.data[0].url;
      res.set('Access-Control-Allow-Origin', '*');
      return res.status(200).json({ result: url });
    } catch (err) {
      console.error(err.response?.data || err.message);
      res.set('Access-Control-Allow-Origin', '*');
      return res.status(500).json({ error: 'GenAI request failed' });
    }
  });
};