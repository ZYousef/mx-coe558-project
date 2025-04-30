import React, { useState } from 'react';
import Weather from './components/Weather';
import GenAI from './components/GenAI';
import History from './components/History';

export default function App() {
  const [refreshFlag, setRefreshFlag] = useState(0);
  const triggerRefresh = () => setRefreshFlag(prev => prev + 1);

  return (
    <div className="flex flex-col min-h-screen p-4">
      <h1 className="text-2xl font-bold mb-4">COE558 Demo App</h1>
      <div className="mb-4">
        <Weather />
      </div>
      <div className="mb-4 flex-grow">
        <GenAI onSave={triggerRefresh} />
      </div>
      <div className="mt-auto">
        <History refreshFlag={refreshFlag} />
      </div>
    </div>
  );
}