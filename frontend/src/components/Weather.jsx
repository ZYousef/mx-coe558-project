import React, { useState, useEffect } from 'react';

export default function Weather() {
  const [data, setData] = useState(null);
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      fetch(`https://me-west1-coe558-project-458416.cloudfunctions.net/weather?lat=${coords.latitude}&lon=${coords.longitude}`)
        .then(res => res.json())
        .then(setData);
    });
  }, []);

  if (!data) return <p>Loading weather...</p>;
  return (
    <div className="mb-6">
      <h2 className="text-xl font-semibold">Current Weather</h2>
      <p>Temp: {data.temperature}°C</p>
      <p>Wind: {data.windspeed} m/s</p>
      <p>Direction: {data.winddirection}°</p>
    </div>
  );
}
