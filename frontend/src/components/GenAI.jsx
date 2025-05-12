/* Enhanced GenAI Component with REST and GraphQL Support */

import React, { useState } from "react";
import { USE_GRAPHQL } from "../config"; // Import the configuration

export default function GenAI({ onSave }) {
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setSaved(false);
    try {
      let res;
      if (USE_GRAPHQL) {
        console.log("Using GraphQL for Generate");
        const query = `
          query ($prompt: String!) {
            generateImage(prompt: $prompt)
          }
        `;
        const variables = { prompt };

        res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query, variables }),
        });
      } else {
        console.log("Using REST for Generate");
        res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt }),
        });
      }

      if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
      const data = await res.json();
      const url = USE_GRAPHQL ? data.data.generateImage : data.result;
      setResult(url);
    } catch (err) {
      setError("Failed to generate image.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!result) return;
    try {
      let res;
      if (USE_GRAPHQL) {
        console.log("Using GraphQL for Save");
        const query = `
          mutation ($prompt: String!, $resultUrl: String!) {
            createItem(prompt: $prompt, resultUrl: $resultUrl) {
              id
              prompt
              resultUrl
              timestamp
            }
          }
        `;
        const variables = { prompt, resultUrl: result };

        res = await fetch("/api/graphql", { 
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query, variables }),
        });
      } else {
        console.log("Using REST for Save");
        res = await fetch("/api/items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, resultUrl: result }),
        });
      }

      if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
      const data = await res.json();
      if (USE_GRAPHQL ? data.data.createItem : true) {
        setSaved(true);
        onSave();
      }
    } catch (err) {
      setError("Failed to save.");
    }
  };

  return (
    <div className=" mx-auto bg-white p-6 rounded-lg shadow space-y-4">
      <h2 className="text-xl font-semibold text-center">Generate Image</h2>
      <div className="flex flex-row sm:flex-row gap-2 block mx-auto">
        <input
          type="text"
          className="flex-1 px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="Enter prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={loading}
        />
        <button
          onClick={handleGenerate}
          disabled={loading || !prompt.trim()}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 block mx-auto"
        >
          Generate
        </button>
      </div>
      {error && <p className="text-red-500">{error}</p>}
      {result && !loading && (
        <button
          onClick={handleSave}
          disabled={saved}
          className={`py-2 rounded text-white ${
            saved
              ? "bg-green-400 cursor-not-allowed"
              : "bg-green-600 hover:bg-green-700"
          }`}
        >
          {saved ? "Saved" : "Save"}
        </button>
      )}
      <div className="text-gray-500 text-sm text-center">
        Enter a prompt and click Generate. Image will appear below.
      </div>
      <div className="w-full h-64 bg-black rounded flex items-center justify-center">
        {loading ? (
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        ) : result ? (
          <img
            src={result}
            alt="AI result"
            className="max-w-full max-h-full object-contain rounded"
          />
        ) : null}
      </div>
    </div>
  );
}
