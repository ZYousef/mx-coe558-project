import React, { useState, useEffect } from 'react';
import Weather from './components/Weather';
import GenAI from './components/GenAI';
import History from './components/History';

export default function App() {
  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">COE558 Demo App</h1>
      <Weather />
      <GenAI />
      <History />
    </div>
  );
}