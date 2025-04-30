// index.js
//load event for .env
require('dotenv').config();
const axios = require('axios');

exports.generate = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).send('Only POST allowed');
  }
  const { prompt } = req.body || {};
  if (!prompt) {
    return res.status(400).json({ error: 'Missing prompt in request body' });
  }

  try {
    const resp = await axios.post(
      'https://api.openai.com/v1/images/generations',
      { prompt, n: 1, size: '1024x1024' },
      { headers: { Authorization: `Bearer ${process.env.GENAI_API_KEY}` } }
    );
    const url = resp.data.data[0].url;
    res.status(200).json({ result: url });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: 'GenAI request failed' });
  }
};