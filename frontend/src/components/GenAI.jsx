import React, { useState } from 'react';

export default function GenAI() {
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState(null);

  const handleGenerate = async () => {
    const res = await fetch('https://me-west1-coe558-project-458416.cloudfunctions.net/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });
    const { result } = await res.json();
    setResult(result);
    // Save to history
    await fetch('https://crud-service-217890144082.me-west1.run.app/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, resultUrl: result })
    });
  };

  return (
    <div className="mb-6">
      <h2 className="text-xl font-semibold">Generate Image</h2>
      <input 
        className="border p-2 mr-2"
        value={prompt}
        onChange={e => setPrompt(e.target.value)}
        placeholder="Enter prompt"
      />
      <button onClick={handleGenerate} className="p-2 bg-blue-600 text-white">Generate</button>
      {result && <div className="mt-4"><img src={result} alt="AI result" className="max-w-full" /></div>}
    </div>
  );
}