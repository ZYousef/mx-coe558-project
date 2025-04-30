// index.js
// require('dotenv').config();                // only if you’re using a .env locally
const functions = require('@google-cloud/functions-framework');
const axios = require('axios');

// const API_KEY = process.env.WEATHER_API_KEY;
// Build Open-Meteo API URL (no API key needed)
const api_url = (lat, lon) =>
  `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;

functions.http('weather', async (req, res) => {
  if (req.method !== 'GET') return res.status(405).send('Only GET allowed');
  // Expect query parameters lat and lon
  const { lat, lon } = req.query;
  if (!lat || !lon) {
    return res.status(400).send('Please specify both lat and lon query parameters');
  }
  try {
    const resp = await axios.get(api_url(lat, lon));
    const { temperature, windspeed, winddirection, weathercode } = resp.data.current_weather;
    res.status(200).json({
      latitude: lat,
      longitude: lon,
      temperature,
      windspeed,
      winddirection,
      weathercode
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching weather');
  }
});