import React, { useState, useEffect } from 'react';

export default function History() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    fetch('https://crud-service-217890144082.me-west1.run.app/items')
      .then(res => res.json())
      .then(setItems);
  }, []);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">History</h2>
      <ul>
        {items.map(item => (
          <li key={item.id} className="border-b py-2">
            <strong>{item.prompt}</strong><br/>
            <a href={item.resultUrl} target="_blank" rel="noopener noreferrer">View Image</a>
          </li>
        ))}
      </ul>
    </div>
  );
}