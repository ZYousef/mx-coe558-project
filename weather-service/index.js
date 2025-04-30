// index.js
// require('dotenv').config();                // only if you’re using a .env locally
const functions = require('@google-cloud/functions-framework');
const cors = require('cors')({ origin: true });
const axios = require('axios');

// Build Open-Meteo API URL (no API key needed)
const api_url = (lat, lon) =>
  `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;

functions.http('weather', (req, res) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).send('');
  }

  // Actual request with CORS
  cors(req, res, async () => {
    if (req.method !== 'GET') {
      res.set('Access-Control-Allow-Origin', '*');
      return res.status(405).send('Only GET allowed');
    }

    const { lat, lon } = req.query;
    if (!lat || !lon) {
      res.set('Access-Control-Allow-Origin', '*');
      return res.status(400).send('Please specify both lat and lon query parameters');
    }

    try {
      const resp = await axios.get(api_url(lat, lon));
      const { temperature, windspeed, winddirection, weathercode } = resp.data.current_weather;
      res.set('Access-Control-Allow-Origin', '*');
      return res.status(200).json({
        latitude: lat,
        longitude: lon,
        temperature,
        windspeed,
        winddirection,
        weathercode
      });
    } catch (err) {
      console.error(err);
      res.set('Access-Control-Allow-Origin', '*');
      return res.status(500).send('Error fetching weather');
    }
  });
});
