import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => setCoords({ lat: coords.latitude, lon: coords.longitude }),
      () => setError('Location permission denied')
    );
  }, []);

  useEffect(() => {
    if (!coords) return;
    (async () => {
      setLoading(true);
      try {
        const { lat, lon } = coords;
        const res = await fetch(`/api/weather?lat=${lat}&lon=${lon}`);
        if (!res.ok) throw new Error(res.statusText);
        const data = await res.json();
        setWeather(data);
      } catch (e) {
        console.error(e);
        setError('Failed to load weather');
      } finally {
        setLoading(false);
      }
    })();
  }, [coords]);

  const toggleUnit = () => setUnit(u => (u === 'C' ? 'F' : 'C'));
  const convert = c => (unit === 'C' ? c : (c * 9) / 5 + 32);

  if (error) return <p className="text-red-500">{error}</p>;
  if (loading || !weather) return <p>Loading weather…</p>;

  const { temperature, weathercode, windspeed, winddirection } = weather;
  const { label, icon: Icon } = CODE_MAP[weathercode] || { label: 'Unknown', icon: WiDaySunny };
  const tempDisplay = Math.round(convert(temperature));

  return (
    <div className="flex items-center space-x-4">
      <Icon size="100px" className="text-black" />
      <div>
        <div className="flex items-baseline space-x-2">
          <span className="text-2xl font-bold">{tempDisplay}°</span>
          <button onClick={toggleUnit} className="text-sm text-gray-600 hover:underline">
            {unit}
          </button>
        </div>
        <p className="capitalize text-base text-gray-700">{label}</p>
        <p className="text-sm text-gray-600">
          Wind: {windspeed} m/s • Dir: {Math.round(winddirection)}°
        </p>
      </div>
    </div>
  );
}