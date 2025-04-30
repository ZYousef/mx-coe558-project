import React, { useState } from 'react';
import { API } from '../config';

export default function GenAI({ onSave }) {
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);
  const GENAI_ENDPOINT = `${API}/generate`;
  const CRUD_ENDPOINT  = `${API}/items`;

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setSaved(false);
    try {
      const res = await fetch(GENAI_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const { result: url } = await res.json();
      setResult(url);
    } catch (err) {
      console.error(err);
      setError('Failed to generate image.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!result) return;
    try {
      await fetch(CRUD_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, resultUrl: result }),
      });
      setSaved(true);
      onSave();
    } catch (err) {
      console.error(err);
      setError('Failed to save.');
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Generate Image</h2>
      <div className="flex flex-col md:flex-row md:space-x-4">
        <div className="flex-1 mb-4 md:mb-0">
          <div className="flex items-center mb-4 space-x-2">
            <input
              type="text"
              className="flex-grow border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Enter prompt"
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              disabled={loading}
            />
            <button
              onClick={handleGenerate}
              disabled={loading || !prompt.trim()}
              className={`px-4 py-2 rounded text-white flex items-center justify-center ${
                loading || !prompt.trim()
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              Generate
            </button>
          </div>

          {error && <p className="text-red-500 mb-4">{error}</p>}

          {result && !loading && (
            <button
              onClick={handleSave}
              disabled={saved}
              className={`mt-4 px-4 py-2 rounded text-white ${
                saved ? 'bg-green-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {saved ? 'Saved' : 'Save'}
            </button>
          )}
          <p className="text-gray-500 mt-2">
            Enter a prompt and click Generate. Image will appear here.
          </p>
        </div>

        <div className="flex-1 w-64 h-64 bg-black rounded flex items-center justify-center">
          {loading ? (
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          ) : result ? (
            <img
              src={result}
              width="256px"
              alt="AI result"
              className="w-full h-full object-contain rounded"
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}