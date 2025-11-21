import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { debounce } from 'lodash';
import { FixedSizeGrid as Grid } from 'react-window';
import { useData } from '../state/DataContext';
import { useNavigate } from 'react-router-dom';

// Card component for virtualization
const ItemCard = ({ columnIndex, rowIndex, style, data }) => {
  const { items, columnCount } = data;
  const index = rowIndex * columnCount + columnIndex;
  const item = items[index];
  const navigate = useNavigate();

  if (!item) {
    return null;
  }

  const handleClick = () => {
    // Navigate to item detail in same tab
    navigate(`/items/${item.id}`);
  };

  return (
    <div style={style} className="px-2 pb-4">
      <div
        onClick={handleClick}
        className="h-full bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden border border-gray-200 cursor-pointer"
      >
        <div className="p-6">
          <div className="bg-gradient-to-br from-blue-500 to-purple-600 h-48 rounded-lg mb-4 flex items-center justify-center">
            <span className="text-4xl text-white font-bold">{item.name.charAt(0)}</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2">{item.name}</h3>
          <p className="text-sm text-gray-500 mb-2">{item.category}</p>
          <p className="text-xl font-bold text-blue-600">${item.price.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
};

function Items() {
  const { items, pagination, searchQuery, loading, fetchItems, setSearchQuery } = useData();
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const containerRef = useRef(null);
  const [containerSize, setContainerSize] = useState({ 
    width: typeof window !== 'undefined' ? window.innerWidth - 32 : 1200, 
    height: typeof window !== 'undefined' ? window.innerHeight - 200 : 600 
  });

  // Calculate responsive column count
  const getColumnCount = (width) => {
    if (width >= 1024) return 4; // lg
    if (width >= 768) return 3;  // md
    if (width >= 640) return 2;  // sm
    return 1; // xs
  };

  const columnCount = useMemo(() => getColumnCount(containerSize.width), [containerSize.width]);
  const rowCount = Math.ceil(items.length / columnCount);
  const cardWidth = (containerSize.width - 32) / columnCount - 16; // 32 for padding, 16 for gap
  const cardHeight = 380; // Approximate card height

  // Calculate full height of all rows for natural scrolling
  const fullGridHeight = rowCount * (cardHeight + 16);

  // Update container size on resize (only width for main scroll)
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerSize({
          width: rect.width || window.innerWidth - 32, // Full width minus padding
          height: 0 // Height calculated dynamically from row count
        });
      } else {
        // Fallback: use window width minus padding
        setContainerSize({
          width: window.innerWidth - 32,
          height: 0
        });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Create debounced search function using lodash
  const debouncedSetSearchQuery = useMemo(
    () => debounce((value) => {
      setSearchQuery(value);
    }, 300),
    [setSearchQuery]
  );

  // Fetch items on mount and when search changes
  useEffect(() => {
    const abortController = new AbortController();
    let active = true;

    if (active) {
      fetchItems(1, pagination.limit, searchQuery, false, abortController.signal);
    }

    return () => {
      active = false;
      abortController.abort(); // Cancel the fetch request on unmount
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  // Cleanup debounced function on unmount
  useEffect(() => {
    return () => {
      debouncedSetSearchQuery.cancel();
    };
  }, [debouncedSetSearchQuery]);

  const handleLoadMore = useCallback(() => {
    if (!loading && pagination.hasNext) {
      // For load more, we don't need to abort on unmount since we're appending
      fetchItems(pagination.page + 1, pagination.limit, searchQuery, true, null);
    }
  }, [loading, pagination.hasNext, pagination.page, pagination.limit, searchQuery, fetchItems]);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setLocalSearchQuery(value);
    debouncedSetSearchQuery(value);
  };

  const clearSearch = () => {
    debouncedSetSearchQuery.cancel();
    setLocalSearchQuery('');
    setSearchQuery('');
    // Create abort controller for this operation
    const abortController = new AbortController();
    fetchItems(1, pagination.limit, '', false, abortController.signal);
  };

  // Grid data for react-window
  const gridData = useMemo(() => ({
    items,
    columnCount
  }), [items, columnCount]);

  return (
    <div className="w-full py-8">
      <div className="container mx-auto px-4 mb-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800">Products</h1>
          {pagination.total > 0 && (
            <p className="text-gray-600">
              Showing {items.length} of {pagination.total}
            </p>
          )}
        </div>

        {/* Search Bar */}
        <div className="mt-6">
          <div className="relative max-w-md">
          <input
            type="text"
            placeholder="Search products by name..."
            value={localSearchQuery}
            onChange={handleSearchChange}
            className="w-full px-4 py-2 pl-10 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
          <svg
            className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {localSearchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          </div>
        </div>
      </div>

      {/* Loading State - Skeleton Cards (Initial Load) */}
      {loading && items.length === 0 && (
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
          {Array.from({ length: pagination.limit || 12 }).map((_, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200"
            >
              <div className="p-6">
                <div className="skeleton h-48 rounded-lg mb-4"></div>
                <div className="skeleton h-5 rounded mb-2"></div>
                <div className="skeleton h-5 rounded w-3/4 mb-4"></div>
                <div className="skeleton h-4 rounded w-1/2 mb-2"></div>
                <div className="skeleton h-6 rounded w-1/3 mt-4"></div>
              </div>
            </div>
          ))}
          </div>
        </div>
      )}

      {/* Items Grid with Virtualization */}
      {!loading && items.length === 0 && (
        <div className="container mx-auto px-4">
          <div className="text-center py-12">
          <p className="text-xl text-gray-600">No products found</p>
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="mt-4 text-blue-600 hover:text-blue-800 underline"
            >
              Clear search
            </button>
          )}
          </div>
        </div>
      )}

      {items.length > 0 && (
        <div ref={containerRef} className="mb-8 w-full px-4">
          <Grid
            columnCount={columnCount}
            columnWidth={cardWidth + 16}
            height={fullGridHeight}
            rowCount={rowCount}
            rowHeight={cardHeight + 16}
            width={containerSize.width}
            itemData={gridData}
            style={{ overflow: 'visible', width: '100%' }}
          >
            {ItemCard}
          </Grid>
        </div>
      )}

      {/* Load More Button */}
      {!loading && items.length > 0 && pagination.hasNext && (
        <div className="flex justify-center mt-8 mb-8">
          <button
            onClick={handleLoadMore}
            className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-md hover:shadow-lg"
          >
            Load More
          </button>
        </div>
      )}

      {/* Loading More Indicator */}
      {loading && items.length > 0 && (
        <div className="flex justify-center items-center py-8">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-gray-600">Loading more items...</span>
          </div>
        </div>
      )}

      {/* End of Results */}
      {!loading && items.length > 0 && !pagination.hasNext && items.length < pagination.total && (
        <div className="text-center py-8">
          <p className="text-gray-600">You've reached the end of the results</p>
        </div>
      )}
    </div>
  );
}

export default Items;
