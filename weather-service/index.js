const functions = require('@google-cloud/functions-framework');
const cors = require('cors')({ origin: true });
const axios = require('axios');

// Build API URLs
const weather_api_url = (lat, lon) =>
  `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;
const geocode_api_url = (city) =>
  `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`;
const reverse_geocode_api_url = (lat, lon) =>
  `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`;

// GraphQL schema and resolver
const { graphql, buildSchema } = require('graphql');

const schema = buildSchema(`
  type Weather {
    latitude: Float
    longitude: Float
    city: String
    temperature: Float
    windspeed: Float
    winddirection: Float
    weathercode: Int
  }

  type Query {
    getWeather(lat: Float, lon: Float, city: String): Weather
  }
`);

const root = {
  getWeather: async ({ lat, lon, city }) => {
    let latitude, longitude, cityName;

    try {
      // If city is provided, geocode it to get lat/lon
      if (city) {
        const geocodeResp = await axios.get(geocode_api_url(city));
        const results = geocodeResp.data.results;
        if (!results || results.length === 0) {
          throw new Error('City not found');
        }
        latitude = results[0].latitude;
        longitude = results[0].longitude;
        cityName = city;
      } else {
        // Use provided lat/lon
        latitude = lat;
        longitude = lon;

        // Fetch city name using BigDataCloud Reverse Geocoding API
        const reverseGeocodeResp = await axios.get(reverse_geocode_api_url(latitude, longitude));
        cityName = reverseGeocodeResp.data.city || reverseGeocodeResp.data.locality || 'Unknown City';
      }

      // Fetch weather data
      const weatherResp = await axios.get(weather_api_url(latitude, longitude));
      const { temperature, windspeed, winddirection, weathercode } = weatherResp.data.current_weather;

      return {
        latitude,
        longitude,
        city: cityName,
        temperature,
        windspeed,
        winddirection,
        weathercode,
      };
    } catch (err) {
      console.error(err);
      throw new Error('Error fetching data');
    }
  },
};

functions.http('weather', (req, res) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).send('');
  }

  // Actual request with CORS
  cors(req, res, async () => {
    if (req.method === 'POST' && req.headers['content-type'] === 'application/json') {
      // Handle GraphQL requests
      const { query, variables } = req.body;
      try {
        const result = await graphql({
          schema,
          source: query,
          rootValue: root,
          variableValues: variables,
        });
        res.set('Access-Control-Allow-Origin', '*');
        return res.status(200).json(result);
      } catch (err) {
        console.error(err);
        res.set('Access-Control-Allow-Origin', '*');
        return res.status(500).send('Error processing GraphQL request');
      }
    } else if (req.method === 'GET') {
      // Handle REST requests
      const { lat, lon, city } = req.query;

      // Check if either city or (lat, lon) is provided
      if (!city && (!lat || !lon)) {
        res.set('Access-Control-Allow-Origin', '*');
        return res.status(400).send('Please specify either a city or both lat and lon query parameters');
      }

      let latitude, longitude, cityName;

      try {
        // If city is provided, geocode it to get lat/lon
        if (city) {
          const geocodeResp = await axios.get(geocode_api_url(city));
          const results = geocodeResp.data.results;
          if (!results || results.length === 0) {
            res.set('Access-Control-Allow-Origin', '*');
            return res.status(404).send('City not found');
          }
          latitude = results[0].latitude;
          longitude = results[0].longitude;
          cityName = city;
        } else {
          // Use provided lat/lon
          latitude = lat;
          longitude = lon;

          // Fetch city name using BigDataCloud Reverse Geocoding API
          const reverseGeocodeResp = await axios.get(reverse_geocode_api_url(latitude, longitude));
          cityName = reverseGeocodeResp.data.city || reverseGeocodeResp.data.locality || 'Unknown City';
        }

        // Fetch weather data
        const weatherResp = await axios.get(weather_api_url(latitude, longitude));
        const { temperature, windspeed, winddirection, weathercode } = weatherResp.data.current_weather;

        res.set('Access-Control-Allow-Origin', '*');
        return res.status(200).json({
          latitude,
          longitude,
          city: cityName,
          temperature,
          windspeed,
          winddirection,
          weathercode,
        });
      } catch (err) {
        console.error(err);
        res.set('Access-Control-Allow-Origin', '*');
        return res.status(500).send('Error fetching data');
      }
    } else {
      res.set('Access-Control-Allow-Origin', '*');
      return res.status(405).send('Method not allowed');
    }
  });
});