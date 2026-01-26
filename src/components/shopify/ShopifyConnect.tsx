/**
 * Shopify Connect Component
 * UI for connecting Shopify stores via OAuth
 */

import { useState } from 'react';
import { Store, ExternalLink, Loader2, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { useShopify } from '../../context/ShopifyContext';

export function ShopifyConnect() {
  const { 
    isAuthenticated, 
    connections, 
    isLoading, 
    error, 
    oauthStatus, 
    oauthMessage,
    connectStore,
    disconnectStore,
    clearError,
    clearOAuthStatus,
  } = useShopify();

  const [shopDomain, setShopDomain] = useState('');
  const [inputError, setInputError] = useState('');

  const activeConnections = connections.filter(c => c.status === 'active');
  const hasConnections = activeConnections.length > 0;

  /**
   * Validate and submit shop domain
   */
  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setInputError('');

    // Basic validation
    let domain = shopDomain.trim().toLowerCase();
    
    // Remove https:// if present
    domain = domain.replace(/^https?:\/\//, '');
    
    // Remove trailing slash
    domain = domain.replace(/\/$/, '');

    // Add .myshopify.com if not present
    if (!domain.includes('.myshopify.com')) {
      domain = `${domain}.myshopify.com`;
    }

    // Validate format
    if (!/^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(domain)) {
      setInputError('Please enter a valid Shopify store domain (e.g., my-store.myshopify.com)');
      return;
    }

    await connectStore(domain);
  };

  // Not authenticated - show login prompt
  if (!isAuthenticated) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-4">
            <Store className="w-6 h-6 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Connect Your Shopify Store
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Sign in to tools.fawadhs.dev to connect your Shopify store and upload images directly.
          </p>
          <a
            href="https://tools.fawadhs.dev/login"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Sign In
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <Store className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Shopify Connections
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {hasConnections 
                ? `${activeConnections.length} store${activeConnections.length > 1 ? 's' : ''} connected`
                : 'Connect a store to upload images'
              }
            </p>
          </div>
        </div>
      </div>

      {/* OAuth Status Messages */}
      {oauthStatus === 'success' && oauthMessage && (
        <div className="mx-6 mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0" />
          <span className="text-sm text-green-700 dark:text-green-300 flex-1">{oauthMessage}</span>
          <button 
            onClick={clearOAuthStatus}
            aria-label="Dismiss success message"
            className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {oauthStatus === 'error' && oauthMessage && (
        <div className="mx-6 mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
          <span className="text-sm text-red-700 dark:text-red-300 flex-1">{oauthMessage}</span>
          <button 
            onClick={clearOAuthStatus}
            aria-label="Dismiss error message"
            className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mx-6 mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
          <span className="text-sm text-red-700 dark:text-red-300 flex-1">{error}</span>
          <button 
            onClick={clearError}
            aria-label="Dismiss error"
            className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Connected Stores */}
      {hasConnections && (
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Connected Stores
          </h4>
          <div className="space-y-2">
            {activeConnections.map(connection => (
              <div 
                key={connection.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <Store className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white text-sm">
                      {connection.shopName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {connection.shopDomain}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => disconnectStore(connection.id)}
                  disabled={isLoading}
                  className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium disabled:opacity-50"
                >
                  Disconnect
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Connect Form */}
      <div className="p-6">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          {hasConnections ? 'Connect Another Store' : 'Connect a Store'}
        </h4>
        <form onSubmit={handleConnect} className="space-y-3">
          <div>
            <label htmlFor="shopDomain" className="sr-only">
              Store Domain
            </label>
            <input
              id="shopDomain"
              type="text"
              value={shopDomain}
              onChange={(e) => {
                setShopDomain(e.target.value);
                setInputError('');
              }}
              placeholder="my-store.myshopify.com"
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              disabled={isLoading || oauthStatus === 'connecting'}
            />
            {inputError && (
              <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{inputError}</p>
            )}
          </div>
          <button
            type="submit"
            disabled={!shopDomain.trim() || isLoading || oauthStatus === 'connecting'}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
          >
            {(isLoading || oauthStatus === 'connecting') ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Store className="w-4 h-4" />
                Connect Store
              </>
            )}
          </button>
        </form>
        <p className="mt-3 text-xs text-gray-500 dark:text-gray-400 text-center">
          You'll be redirected to Shopify to authorize the connection
        </p>
      </div>
    </div>
  );
}

export default ShopifyConnect;
