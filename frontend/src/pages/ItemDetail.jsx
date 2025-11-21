import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

function ItemDetail() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('http://localhost:4001/api/items/' + id)
      .then(res => res.ok ? res.json() : Promise.reject(res))
      .then(setItem)
      .catch(() => navigate('/'));
  }, [id, navigate]);

  if (!item) return (
    <div className="flex justify-center items-center min-h-screen">
      <p className="text-xl text-gray-600">Loading...</p>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-64 flex items-center justify-center">
          <span className="text-8xl text-white font-bold">{item.name.charAt(0)}</span>
        </div>
        <div className="p-8">
          <h2 className="text-4xl font-bold text-gray-800 mb-6">{item.name}</h2>
          <div className="space-y-4">
            <div className="flex items-center">
              <span className="text-gray-600 font-semibold w-32">Category:</span>
              <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                {item.category}
              </span>
            </div>
            <div className="flex items-center">
              <span className="text-gray-600 font-semibold w-32">Price:</span>
              <span className="text-3xl font-bold text-blue-600">${item.price.toLocaleString()}</span>
            </div>
          </div>
          <button
            onClick={() => navigate('/')}
            className="mt-8 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-200"
          >
            Back to Products
          </button>
        </div>
      </div>
    </div>
  );
}

export default ItemDetail;