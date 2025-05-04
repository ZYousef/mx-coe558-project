import React, { useState, useEffect } from 'react';
import { API } from '../config';
import {
  WiDaySunny,
  WiDayCloudy,
  WiCloud,
  WiFog,
  WiSprinkle,
  WiRain,
  WiThunderstorm,
  WiSnow
} from 'react-icons/wi';

const CODE_MAP = {
  0:  { label: 'Clear sky',      icon: WiDaySunny },
  1:  { label: 'Mainly clear',   icon: WiDaySunny },
  2:  { label: 'Partly cloudy',  icon: WiDayCloudy },
  3:  { label: 'Overcast',       icon: WiCloud },
  45: { label: 'Fog',            icon: WiFog },
  48: { label: 'Rime fog',       icon: WiFog },
  51: { label: 'Light drizzle',  icon: WiSprinkle },
  61: { label: 'Light rain',     icon: WiRain },
  63: { label: 'Moderate rain',  icon: WiRain },
  65: { label: 'Heavy rain',     icon: WiRain },
  71: { label: 'Snow fall',      icon: WiSnow },
  73: { label: 'Snow showers',   icon: WiSnow },
  75: { label: 'Heavy snow',     icon: WiSnow },
  95: { label: 'Thunderstorm',   icon: WiThunderstorm },
  99: { label: 'Hail',           icon: WiThunderstorm }
};

export default function Weather() {
  const [coords, setCoords] = useState(null);
  const [weather, setWeather] = useState(null);
  const [unit, setUnit] = useState('C');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cityInput, setCityInput] = useState('');
  const [currentCity, setCurrentCity] = useState('');

  // Get geolocation on mount
  useEffect(() => {
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => setCoords({ lat: coords.latitude, lon: coords.longitude }),
      () => {
        setError('Location permission denied');
        setLoading(false);
      }
    );
  }, []);

  // Fetch weather data when coords or city changes
  const fetchWeather = async (city = '', lat = null, lon = null) => {
    setLoading(true);
    try {
      let url;
      if (city) {
        url = `${API}/weather?city=${encodeURIComponent(city)}`;
      } else if (lat && lon) {
        url = `${API}/weather?lat=${lat}&lon=${lon}`;
      } else {
        throw new Error('No valid location data');
      }

      const res = await fetch(url);
      if (!res.ok) {
        if (res.status === 404) throw new Error('City not found');
        throw new Error(res.statusText);
      }
      const data = await res.json();
      setWeather(data);
      setCurrentCity(data.city); // Use API-provided city name
    } catch (e) {
      console.error(e);
      setError(e.message || 'Failed to load weather');
    } finally {
      setLoading(false);
    }
  };

  // Fetch weather when coords change
  useEffect(() => {
    if (coords) {
      fetchWeather('', coords.lat, coords.lon);
    }
  }, [coords]);

  // Handle city search
  const handleSearch = (e) => {
    e.preventDefault();
    if (cityInput.trim()) {
      fetchWeather(cityInput);
      setCityInput('');
    }
  };

  // Reset to geolocation
  const resetToGeolocation = () => {
    setLoading(true);
    setError(null);
    setCurrentCity('');
    setWeather(null);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => setCoords({ lat: coords.latitude, lon: coords.longitude }),
      () => {
        setError('Location permission denied');
        setLoading(false);
      }
    );
  };

  const toggleUnit = () => setUnit(u => (u === 'C' ? 'F' : 'C'));
  const convert = c => (unit === 'C' ? c : (c * 9) / 5 + 32);

  if (error) {
    return (
      <div className="p-4 max-w-md mx-auto">
        <p className="text-red-500">{error}</p>
        <button
          onClick={resetToGeolocation}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          Try Geolocation Again
        </button>
      </div>
    );
  }

  if (loading || !weather) {
    return (
      <div className="p-4 max-w-md mx-auto">
        <p>Loading weather…</p>
        <div className="mt-2 animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const { temperature, weathercode, windspeed, winddirection } = weather;
  const { label, icon: Icon } = CODE_MAP[weathercode] || { label: 'Unknown', icon: WiDaySunny };
  const tempDisplay = Math.round(convert(temperature));

  return (
    <div className="p-4 max-w-md mx-auto">
      {/* City Search Form */}
      <form onSubmit={handleSearch} className="mb-4 flex space-x-2">
        <input
          type="text"
          value={cityInput}
          onChange={(e) => setCityInput(e.target.value)}
          placeholder="Enter city name"
          className="flex-1 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400"
        >
          Search
        </button>
      </form>

      {/* Reset to Geolocation */}
      <button
        onClick={resetToGeolocation}
        className="mb-4 text-sm text-blue-500 hover:underline"
      >
        Use My Location
      </button>

      {/* Weather Display */}
      <div className="flex items-center space-x-4">
        <Icon size="100px" className="text-black" />
        <div>
          <h2 className="text-xl font-semibold">
            {currentCity === 'Unknown Location' ? 'Unknown Location' : currentCity}
          </h2>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold">{tempDisplay}°</span>
            <button
              onClick={toggleUnit}
              className="text-sm text-gray-600 hover:underline"
            >
              {unit}
            </button>
          </div>
          <p className="capitalize text-base text-gray-700">{label}</p>
          <p className="text-sm text-gray-600">
            Wind: {windspeed} m/s • Dir: {Math.round(winddirection)}°
          </p>
        </div>
      </div>
    </div>
  );
}