import React, { useState, useEffect } from "react";
import {
  WiDaySunny,
  WiDayCloudy,
  WiCloud,
  WiFog,
  WiSprinkle,
  WiRain,
  WiThunderstorm,
  WiSnow,
} from "react-icons/wi";
import { API, USE_GRAPHQL } from "../config";

const CODE_MAP = {
  0: { label: "Clear sky", icon: WiDaySunny },
  1: { label: "Mainly clear", icon: WiDaySunny },
  2: { label: "Partly cloudy", icon: WiDayCloudy },
  3: { label: "Overcast", icon: WiCloud },
  45: { label: "Fog", icon: WiFog },
  48: { label: "Rime fog", icon: WiFog },
  51: { label: "Light drizzle", icon: WiSprinkle },
  61: { label: "Light rain", icon: WiRain },
  63: { label: "Moderate rain", icon: WiRain },
  65: { label: "Heavy rain", icon: WiRain },
  71: { label: "Snow fall", icon: WiSnow },
  73: { label: "Snow showers", icon: WiSnow },
  75: { label: "Heavy snow", icon: WiSnow },
  95: { label: "Thunderstorm", icon: WiThunderstorm },
  99: { label: "Hail", icon: WiThunderstorm },
};

export default function Weather() {
  const [coords, setCoords] = useState(null);
  const [weather, setWeather] = useState(null);
  const [unit, setUnit] = useState("C");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cityInput, setCityInput] = useState("");
  const [currentCity, setCurrentCity] = useState("");

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      ({ coords }) =>
        setCoords({ lat: coords.latitude, lon: coords.longitude }),
      () => {
        setError("Location permission denied");
        setLoading(false);
      },
    );
  }, []);

  const fetchWeather = async (city = "", lat = null, lon = null) => {
    setLoading(true);
    try {
      let data;

      if (USE_GRAPHQL) {
        console.log("Fetching weather data through GraphQL...");
        const query = city
          ? `query ($city: String!) { getWeather(city: $city) { city temperature weathercode windspeed winddirection } }`
          : `query ($lat: Float!, $lon: Float!) { getWeather(lat: $lat, lon: $lon) { city temperature weathercode windspeed winddirection } }`;

        const variables = city
          ? { city }
          : { lat: parseFloat(lat), lon: parseFloat(lon) };

        console.log("GraphQL Query:", query);
        console.log("GraphQL Variables:", variables);

        const res = await fetch(`${API}/weather`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query, variables }),
        });

        console.log("GraphQL Response Status:", res.status);
        if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);

        const json = await res.json();
        console.log("GraphQL Response JSON:", json);
        data = json.data.getWeather;
      } else {
        console.log("Fetching weather data through REST...");
        const url = city
          ? `${API}/weather?city=${encodeURIComponent(city)}`
          : `${API}/weather?lat=${lat}&lon=${lon}`;
        console.log("REST URL:", url);

        const res = await fetch(url);
        console.log("REST Response Status:", res.status);
        if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);

        data = await res.json();
        console.log("REST Response JSON:", data);
      }

      setWeather(data);
      setCurrentCity(data.city);
    } catch (err) {
      console.error("Error fetching weather:", err);
      setError("Failed to load weather.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (coords) fetchWeather("", coords.lat, coords.lon);
  }, [coords]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (cityInput.trim()) {
      fetchWeather(cityInput);
      setCityInput("");
    }
  };

  const resetToGeolocation = () => {
    navigator.geolocation.getCurrentPosition(
      ({ coords }) =>
        setCoords({ lat: coords.latitude, lon: coords.longitude }),
      () => setError("Location permission denied"),
    );
  };

  const toggleUnit = () => setUnit((u) => (u === "C" ? "F" : "C"));
  const convert = (c) => (unit === "C" ? c : (c * 9) / 5 + 32);

  const { temperature, weathercode, windspeed, winddirection } = weather || {};
  const { label, icon: Icon } = CODE_MAP[weathercode] || {
    label: "Unknown",
    icon: WiDaySunny,
  };
  const tempDisplay = Math.round(convert(temperature || 0));

  return (
    <div className="bg-white rounded-xl shadow p-6 max-w-4xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 text-center">Weather</h2>
      <form
        onSubmit={handleSearch}
        className="flex flex-row sm:flex-row gap-4 max-w-md mx-auto px-4"
      >
        <input
          type="text"
          value={cityInput}
          onChange={(e) => setCityInput(e.target.value)}
          placeholder="Enter city"
          className="flex-1 px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <button
          type="submit"
          className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
        >
          Search
        </button>
      </form>
      <button
        onClick={resetToGeolocation}
        className="text-sm text-blue-500 hover:underline block mx-auto px-4 py-2"
      >
        Use My Location
      </button>
      {error && <p className="text-red-500 text-center px-4">{error}</p>}
      {loading ? (
        <p className="text-gray-500 text-center px-4">Loading weather...</p>
      ) : (
        weather && (
          <div className="flex items-center gap-6 px-4">
            <Icon size={80} className="text-black" />
            <div>
              <h3 className="text-xl font-semibold">{currentCity}</h3>
              <p className="text-3xl font-bold">
                {tempDisplay}°{unit}
              </p>
              <p className="capitalize text-gray-600">{label}</p>
              <p className="text-sm text-gray-500">
                Wind: {windspeed} m/s • Dir: {Math.round(winddirection)}°
              </p>
              <button
                onClick={toggleUnit}
                className="text-sm text-gray-500 hover:underline mt-2"
              >
                Toggle °C/°F
              </button>
            </div>
          </div>
        )
      )}
    </div>
  );
}
