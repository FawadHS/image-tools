/**
 * Shopify Connect Component
 * Read-only display of connected stores
 * Connection management happens on tools.fawadhs.dev/settings#shopify
 */

import { Store, ExternalLink, Loader2, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import { useShopify } from '../../context/ShopifyContext';

export function ShopifyConnect() {
  const { 
    connections, 
    isLoading, 
    error,
    refreshConnections,
  } = useShopify();

  const activeConnections = connections.filter(c => c.status === 'active');
  const hasConnections = activeConnections.length > 0;

  return (
    <div className="space-y-4">
      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
          <span className="text-sm text-red-700 dark:text-red-300 flex-1">{error}</span>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-6 h-6 animate-spin text-green-500" />
        </div>
      )}

      {/* Connected Stores */}
      {!isLoading && hasConnections && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Connected Stores
            </h4>
            <button
              onClick={refreshConnections}
              className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              Refresh
            </button>
          </div>
          <div className="space-y-2">
            {activeConnections.map(connection => (
              <div 
                key={connection.id}
                className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
              >
                <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
                    {connection.shopName || connection.shopDomain}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {connection.shopDomain}
                  </p>
                </div>
                <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                  Connected
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Connections - Link to Settings */}
      {!isLoading && !hasConnections && (
        <div className="text-center py-4">
          <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-3">
            <Store className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            No Shopify stores connected yet
          </p>
        </div>
      )}

      {/* Manage Stores Link */}
      <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
        <a
          href="https://tools.fawadhs.dev/settings#shopify"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Store className="w-4 h-4" />
          {hasConnections ? 'Manage Stores' : 'Connect Store'}
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
          Manage your Shopify connections in Settings
        </p>
      </div>
    </div>
  );
}

export default ShopifyConnect;
