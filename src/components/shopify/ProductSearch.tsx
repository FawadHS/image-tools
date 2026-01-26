/**
 * Product Search Component
 * Search and select Shopify products for media attachment
 */

import { useState, useEffect, useCallback } from 'react';
import { Search, Package, X, Loader2, AlertCircle } from 'lucide-react';
import { shopifyApi, type ShopifyProduct } from '../../services/shopifyApi';
import { useShopify } from '../../context/ShopifyContext';

interface ProductSearchProps {
  onSelect: (product: ShopifyProduct) => void;
  selectedProduct: ShopifyProduct | null;
  onClear: () => void;
}

export function ProductSearch({ onSelect, selectedProduct, onClear }: ProductSearchProps) {
  const { activeConnection } = useShopify();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ShopifyProduct[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);

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
        10
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

  // Handle product selection
  const handleSelect = (product: ShopifyProduct) => {
    onSelect(product);
    setQuery('');
    setResults([]);
    setShowResults(false);
  };

  // If a product is selected, show it
  if (selectedProduct) {
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
          className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products by title or SKU..."
          className="w-full pl-10 pr-10 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
        {isSearching && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
        )}
      </div>

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
            <button
              key={product.id}
              onClick={() => handleSelect(product)}
              className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 first:rounded-t-lg last:rounded-b-lg text-left"
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
                    <span>SKU: {product.variants[0].sku}</span>
                  )}
                  <span className={`px-1.5 py-0.5 rounded text-xs ${
                    product.status === 'ACTIVE' 
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                      : 'bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
                  }`}>
                    {product.status}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No Results */}
      {showResults && results.length === 0 && query.length >= 2 && !isSearching && !error && (
        <div className="absolute top-full left-0 right-0 mt-1 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20 text-center">
          <Package className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No products found for "{query}"
          </p>
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
  );
}

export default ProductSearch;
