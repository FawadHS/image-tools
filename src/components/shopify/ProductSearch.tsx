/**
 * Product Search Component
 * Search and select Shopify products for media attachment
 * Supports both inline search and browse modal
 */

import { useState, useEffect, useCallback } from 'react';
import { Search, Package, X, Loader2, AlertCircle, Grid, ChevronRight } from 'lucide-react';
import { shopifyApi, type ShopifyProduct } from '../../services/shopifyApi';
import { useShopify } from '../../context/ShopifyContext';

interface ProductSearchProps {
  onSelect: (product: ShopifyProduct) => void;
  selectedProduct: ShopifyProduct | null;
  onClear: () => void;
  compact?: boolean; // For inline use in per-file mapping
}

export function ProductSearch({ onSelect, selectedProduct, onClear, compact = false }: ProductSearchProps) {
  const { activeConnection } = useShopify();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ShopifyProduct[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  
  // Browse modal state
  const [showBrowseModal, setShowBrowseModal] = useState(false);
  const [browseProducts, setBrowseProducts] = useState<ShopifyProduct[]>([]);
  const [browseLoading, setBrowseLoading] = useState(false);
  const [browseError, setBrowseError] = useState<string | null>(null);
  const [browseCursor, setBrowseCursor] = useState<string | null>(null);
  const [browseHasMore, setBrowseHasMore] = useState(false);

  // Debounced search
  const searchProducts = useCallback(async (searchQuery: string) => {
    if (!activeConnection || searchQuery.length < 2) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      const response = await shopifyApi.searchProducts(
        activeConnection.id,
        searchQuery,
        15
      );
      setResults(response.products);
      setShowResults(true);
    } catch (err) {
      console.error('[ProductSearch] Search failed:', err);
      setError(err instanceof Error ? err.message : 'Search failed');
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [activeConnection]);

  // Debounce effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length >= 2) {
        searchProducts(query);
      } else {
        setResults([]);
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, searchProducts]);

  // Load products for browse modal
  const loadBrowseProducts = useCallback(async (cursor?: string) => {
    if (!activeConnection) return;

    setBrowseLoading(true);
    setBrowseError(null);

    try {
      const response = await shopifyApi.listProducts(
        activeConnection.id,
        20,
        cursor
      );
      
      if (cursor) {
        setBrowseProducts(prev => [...prev, ...response.products]);
      } else {
        setBrowseProducts(response.products);
      }
      setBrowseHasMore(response.hasMore);
      setBrowseCursor(response.endCursor);
    } catch (err) {
      console.error('[ProductSearch] Browse failed:', err);
      setBrowseError(err instanceof Error ? err.message : 'Failed to load products');
    } finally {
      setBrowseLoading(false);
    }
  }, [activeConnection]);

  // Open browse modal
  const openBrowseModal = () => {
    setShowBrowseModal(true);
    setShowResults(false);
    if (browseProducts.length === 0) {
      loadBrowseProducts();
    }
  };

  // Handle product selection
  const handleSelect = (product: ShopifyProduct) => {
    onSelect(product);
    setQuery('');
    setResults([]);
    setShowResults(false);
    setShowBrowseModal(false);
  };

  // Helper function to render browse modal (reused by both compact and full mode)
  const renderBrowseModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50" 
        onClick={() => setShowBrowseModal(false)}
      />
      
      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Select Product
          </h3>
          <button
            onClick={() => setShowBrowseModal(false)}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Product List */}
        <div className="flex-1 overflow-y-auto p-2">
          {browseError && (
            <div className="p-4 text-center">
              <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
              <p className="text-sm text-red-600 dark:text-red-400">{browseError}</p>
              <button
                onClick={() => loadBrowseProducts()}
                className="mt-2 text-sm text-green-600 hover:underline"
              >
                Try again
              </button>
            </div>
          )}

          {!browseError && browseProducts.length === 0 && browseLoading && (
            <div className="p-8 text-center">
              <Loader2 className="w-8 h-8 text-green-500 animate-spin mx-auto mb-2" />
              <p className="text-sm text-gray-500">Loading products...</p>
            </div>
          )}

          {!browseError && browseProducts.length === 0 && !browseLoading && (
            <div className="p-8 text-center">
              <Package className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No products in store</p>
            </div>
          )}

          {browseProducts.map((product) => (
            <ProductItem 
              key={product.id} 
              product={product} 
              onSelect={handleSelect}
              showArrow 
            />
          ))}

          {/* Load More */}
          {browseHasMore && !browseLoading && (
            <button
              onClick={() => loadBrowseProducts(browseCursor || undefined)}
              className="w-full py-3 text-sm text-green-600 dark:text-green-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Load more products
            </button>
          )}

          {browseLoading && browseProducts.length > 0 && (
            <div className="py-4 text-center">
              <Loader2 className="w-5 h-5 text-green-500 animate-spin mx-auto" />
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // If a product is selected, show it
  if (selectedProduct) {
    if (compact) {
      // Compact mode - minimal display
      return (
        <div className="flex items-center gap-2 py-1">
          {selectedProduct.featuredImage ? (
            <img
              src={selectedProduct.featuredImage.url}
              alt={selectedProduct.title}
              className="w-6 h-6 rounded object-cover"
            />
          ) : (
            <div className="w-6 h-6 rounded bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
              <Package className="w-3 h-3 text-gray-400" />
            </div>
          )}
          <span className="text-xs text-gray-900 dark:text-white truncate flex-1">
            {selectedProduct.title}
          </span>
          <button
            onClick={onClear}
            className="p-0.5 text-gray-400 hover:text-red-500"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      );
    }
    
    // Full mode - larger display
    return (
      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 flex items-center gap-3">
        {selectedProduct.featuredImage ? (
          <img
            src={selectedProduct.featuredImage.url}
            alt={selectedProduct.title}
            className="w-12 h-12 rounded-lg object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded-lg bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
            <Package className="w-6 h-6 text-gray-400" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {selectedProduct.title}
          </p>
          {selectedProduct.variants[0]?.sku && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              SKU: {selectedProduct.variants[0].sku}
            </p>
          )}
        </div>
        <button
          onClick={onClear}
          title="Clear selection"
          className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // Compact mode - simplified search UI
  if (compact) {
    return (
      <div className="relative">
        <div className="flex gap-1">
          <div className="relative flex-1">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search product..."
              className="w-full pl-2 pr-6 py-1 bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-transparent"
            />
            {isSearching && (
              <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 animate-spin" />
            )}
          </div>
          <button
            onClick={openBrowseModal}
            title="Browse"
            className="px-1.5 py-1 bg-gray-100 dark:bg-gray-500 hover:bg-gray-200 dark:hover:bg-gray-400 rounded transition-colors"
          >
            <Grid className="w-3 h-3 text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        {/* Compact search results */}
        {showResults && results.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow-lg z-50 max-h-40 overflow-y-auto">
            {results.map((product) => (
              <button
                key={product.id}
                onClick={() => handleSelect(product)}
                className="w-full p-2 flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-left"
              >
                {product.featuredImage ? (
                  <img
                    src={product.featuredImage.url}
                    alt={product.title}
                    className="w-6 h-6 rounded object-cover"
                  />
                ) : (
                  <div className="w-6 h-6 rounded bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                    <Package className="w-3 h-3 text-gray-400" />
                  </div>
                )}
                <span className="text-xs text-gray-900 dark:text-white truncate">
                  {product.title}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Browse Modal - reuse existing */}
        {showBrowseModal && renderBrowseModal()}
      </div>
    );
  }

  return (
    <>
      <div className="relative">
        {/* Search Input with Browse Button */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title, SKU..."
              className="w-full pl-10 pr-10 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
            )}
          </div>
          <button
            onClick={openBrowseModal}
            title="Browse all products"
            className="px-3 py-2.5 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 border border-gray-200 dark:border-gray-600 rounded-lg transition-colors"
          >
            <Grid className="w-4 h-4 text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        {/* Helper text */}
        <p className="mt-1.5 text-xs text-gray-400">
          Type to search or click grid to browse all products
        </p>

        {/* Error Message */}
        {error && (
          <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <span className="text-xs text-red-600 dark:text-red-400">{error}</span>
          </div>
        )}

        {/* Search Results Dropdown */}
        {showResults && results.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20 max-h-64 overflow-y-auto">
            {results.map((product) => (
              <ProductItem 
                key={product.id} 
                product={product} 
                onSelect={handleSelect} 
              />
            ))}
          </div>
        )}

        {/* No Results */}
        {showResults && results.length === 0 && query.length >= 2 && !isSearching && !error && (
          <div className="absolute top-full left-0 right-0 mt-1 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20 text-center">
            <Package className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              No products found for "{query}"
            </p>
            <button
              onClick={openBrowseModal}
              className="text-sm text-green-600 dark:text-green-400 hover:underline"
            >
              Browse all products instead
            </button>
          </div>
        )}

        {/* Click outside to close */}
        {showResults && (
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setShowResults(false)}
          />
        )}
      </div>

      {/* Browse Modal */}
      {showBrowseModal && renderBrowseModal()}
    </>
  );
}

/**
 * Reusable product item component
 */
function ProductItem({ 
  product, 
  onSelect,
  showArrow = false,
}: { 
  product: ShopifyProduct; 
  onSelect: (p: ShopifyProduct) => void;
  showArrow?: boolean;
}) {
  return (
    <button
      onClick={() => onSelect(product)}
      className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg text-left transition-colors"
    >
      {product.featuredImage ? (
        <img
          src={product.featuredImage.url}
          alt={product.title}
          className="w-10 h-10 rounded object-cover flex-shrink-0"
        />
      ) : (
        <div className="w-10 h-10 rounded bg-gray-100 dark:bg-gray-600 flex items-center justify-center flex-shrink-0">
          <Package className="w-5 h-5 text-gray-400" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
          {product.title}
        </p>
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          {product.variants[0]?.sku && (
            <span className="truncate max-w-[120px]">SKU: {product.variants[0].sku}</span>
          )}
          <span className={`px-1.5 py-0.5 rounded text-xs flex-shrink-0 ${
            product.status === 'ACTIVE' 
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
              : 'bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
          }`}>
            {product.status}
          </span>
        </div>
      </div>
      {showArrow && (
        <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
      )}
    </button>
  );
}

export default ProductSearch;
