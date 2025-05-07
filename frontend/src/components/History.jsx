import React, { useState, useEffect, useCallback } from "react";
import debounce from "lodash/debounce";

export default function History({ refreshFlag }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/items");
      const data = await res.json();
      setItems(data);
    } catch (err) {
      console.error("Failed to fetch history:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = useCallback(
    debounce(async (id) => {
      if (!window.confirm("Delete this item?")) return;
      try {
        const res = await fetch(`/api/items/${id}`, { method: "DELETE" });
        if (res.ok) setItems((prev) => prev.filter((item) => item.id !== id));
      } catch (err) {
        console.error("Delete failed:", err);
      }
    }, 300),
    [],
  );

  useEffect(() => {
    fetchItems();
  }, [refreshFlag]);

  return (
    <div className="bg-white rounded-xl shadow p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-gray-800 text-center">
        History
      </h2>
      {loading ? (
        <p className="text-gray-500">Loading history...</p>
      ) : items.length === 0 ? (
        <p className="text-gray-400">No history yet.</p>
      ) : (
        <table className="w-full table-auto text-left">
          <thead className="bg-gray-100 text-gray-600">
            <tr>
              <th className="px-4 py-2">Prompt</th>
              <th className="px-4 py-2">Date</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-2 text-gray-800">{item.prompt}</td>
                <td className="px-4 py-2 text-gray-600">
                  {new Date(item.timestamp).toLocaleString()}
                </td>
                <td className="px-4 py-2 flex gap-4">
                  <button
                    onClick={() =>
                      window.open(
                        item.resultUrl,
                        "_blank",
                        "noopener,noreferrer",
                      )
                    }
                    className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                  >
                    View
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
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
