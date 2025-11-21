import React, { createContext, useCallback, useContext, useState } from 'react';

const DataContext = createContext();

export function DataProvider({ children }) {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchItems = useCallback(async (page = 1, limit = 12, q = '', append = false, signal = null) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (q) {
        params.append('q', q);
      }
      
      const res = await fetch(`http://localhost:4001/api/items?${params.toString()}`, { signal });
      const data = await res.json();
      
      // Check if request was aborted before updating state
      if (signal?.aborted) {
        return;
      }
      
      if (append) {
        // Append new items to existing ones
        setItems(prevItems => [...prevItems, ...(data.items || [])]);
      } else {
        // Replace items (for new search or initial load)
        setItems(data.items || []);
      }
      
      // Check again before updating pagination (race condition protection)
      if (!signal?.aborted) {
        setPagination(data.pagination || {
          page: 1,
          limit: 12,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false
        });
      }
    } catch (error) {
      // Don't log or update state if the request was aborted
      if (error.name === 'AbortError') {
        return;
      }
      console.error('Error fetching items:', error);
      // Only update state if not aborted
      if (!signal?.aborted && !append) {
        setItems([]);
      }
    } finally {
      // Only update loading state if not aborted
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, []);

  return (
    <DataContext.Provider value={{ 
      items, 
      pagination,
      searchQuery,
      loading,
      fetchItems, 
      setSearchQuery 
    }}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext);