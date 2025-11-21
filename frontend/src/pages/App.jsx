import React, { useEffect, useState } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import Items from './Items';
import ItemDetail from './ItemDetail';
import { DataProvider } from '../state/DataContext';

function App() {
  const [stats, setStats] = useState({ total: 0, averagePrice: 0 });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('http://localhost:4001/api/stats');
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <DataProvider>
      <nav className="bg-white shadow-md border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link 
              to="/" 
              className="text-2xl font-bold text-gray-800 hover:text-blue-600 transition-colors duration-200"
            >
              Items Store
            </Link>
            
            {/* Stats Info */}
            <div className="flex items-center gap-6">
              {!loadingStats && (
                <>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Total Products</p>
                    <p className="text-lg font-semibold text-gray-800">{stats.total}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Avg Price</p>
                    <p className="text-lg font-semibold text-gray-800">${stats.averagePrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  </div>
                </>
              )}
              {loadingStats && (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-sm text-gray-500">Loading stats...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
      <main className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={<Items />} />
          <Route path="/items/:id" element={<ItemDetail />} />
        </Routes>
      </main>
    </DataProvider>
  );
}

export default App;