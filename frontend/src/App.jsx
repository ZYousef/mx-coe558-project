import React, { useState } from "react";
import Weather from "./components/Weather";
import History from "./components/History";
import GenAI from "./components/GenAI";

export default function App() {
  const [refreshFlag, setRefreshFlag] = useState(0);
  const triggerRefresh = () => setRefreshFlag((prev) => prev + 1);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
      <div className=" max-w-4xl space-y-6 mx-auto">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">
          COE558 Demo App
        </h1>
        <Weather />
        <GenAI onSave={triggerRefresh} />
        <History refreshFlag={refreshFlag} />
      </div>
    </div>
  );
}
