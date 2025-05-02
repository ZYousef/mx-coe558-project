import React, { useState, useEffect, useCallback } from 'react';
import debounce from 'lodash/debounce';

export default function History({ refreshFlag }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/items', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) {
        throw new Error(`HTTP error! Status: ${res.status}`);
      }
      const data = await res.json();
      setItems(data);
    } catch (err) {
      console.error('Failed to fetch history:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = useCallback(
    debounce(async (id) => {
      if (!window.confirm('Delete this item?')) return;
      try {
        const res = await fetch(`/api/items/${id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        if (!res.ok) {
          throw new Error(`HTTP error! Status: ${res.status}`);
        }
        setItems((prev) => prev.filter((item) => item.id !== id));
      } catch (err) {
        console.error('Failed to delete item:', err);
      }
    }, 300),
    []
  );

  useEffect(() => {
    fetchItems();
  }, [refreshFlag]);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">History</h2>
      {loading ? (
        <p>Loading history...</p>
      ) : items.length === 0 ? (
        <p>No history yet.</p>
      ) : (
        <table className="min-w-full table-auto">
          <thead>
            <tr className="bg-gray-200">
              <th className="px-4 py-2 text-left">Prompt</th>
              <th className="px-4 py-2 text-left">Date</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-2">{item.prompt}</td>
                <td className="px-4 py-2">{new Date(item.timestamp).toLocaleString()}</td>
                <td className="px-4 py-2 space-x-2">
                  <a
                    href={item.resultUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    View
                  </a>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}