/**
 * Shopify Panel Component
 * Main Shopify integration UI in the settings area
 */

import { ShopifyProvider } from '../../context/ShopifyContext';
import { ShopifyConnect } from './ShopifyConnect';
import { ShopifyUploader } from './ShopifyUploader';
import { useShopify } from '../../context/ShopifyContext';
import { Store, Upload, Crown, ExternalLink } from 'lucide-react';
import { useState } from 'react';

type TabType = 'connect' | 'upload';

function ShopifyPanelContent() {
  const { connections } = useShopify();
  const [activeTab, setActiveTab] = useState<TabType>('connect');

  const hasActiveConnection = connections.some(c => c.status === 'active');

  // Check if user is logged in to the main platform
  const isPlatformAuthenticated = isUserAuthenticated();
  
  // Show login prompt if not authenticated to main platform
  if (!isPlatformAuthenticated) {
    return (
      <div className="text-center py-4">
        <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-4">
          <Store className="w-6 h-6 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Login Required
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Sign in to tools.fawadhs.dev to connect your Shopify store.
        </p>
        <a
          href="https://tools.fawadhs.dev/login"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          Sign In
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    );
  }

  // Show upgrade prompt for free users (check subscription from auth state)
  const userTier = getUserTier();
  const canUseShopify = userTier === 'pro' || userTier === 'business';

  if (!canUseShopify) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto mb-4">
            <Crown className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Upgrade to Pro
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Shopify integration is available on Pro and Business plans. 
            Upload images directly to your store with one click.
          </p>
          <div className="flex flex-col gap-2">
            <a
              href="https://tools.fawadhs.dev/pricing"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              View Plans
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Pro: 1 store, 500 uploads/mo • Business: 5 stores, unlimited
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Tab Navigation */}
      {hasActiveConnection && (
        <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
          <button
            onClick={() => setActiveTab('connect')}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'connect'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Store className="w-4 h-4" />
            Stores
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'upload'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Upload className="w-4 h-4" />
            Upload
          </button>
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'connect' && <ShopifyConnect />}
      {activeTab === 'upload' && hasActiveConnection && <ShopifyUploader />}
    </div>
  );
}

/**
 * Get user subscription tier from localStorage
 * The main fawadhs-tools app stores user in Zustand persist: auth-storage -> state.user.tier
 */
function getUserTier(): string {
  try {
    const authStore = localStorage.getItem('auth-storage');
    if (authStore) {
      const parsed = JSON.parse(authStore);
      // Try both possible field names (tier for zustand store, subscriptionTier for backup)
      return parsed?.state?.user?.tier || parsed?.state?.user?.subscriptionTier || 'free';
    }
  } catch {
    // Ignore parse errors
  }
  return 'free';
}

/**
 * Check if user is authenticated (has valid token)
 */
function isUserAuthenticated(): boolean {
  // Check direct token first
  const directToken = localStorage.getItem('token');
  if (directToken) return true;
  
  // Check Zustand store
  try {
    const authStore = localStorage.getItem('auth-storage');
    if (authStore) {
      const parsed = JSON.parse(authStore);
      return !!parsed?.state?.token;
    }
  } catch {
    // Ignore parse errors
  }
  return false;
}

/**
 * Shopify Panel - wrapped with provider
 */
export function ShopifyPanel() {
  return (
    <ShopifyProvider>
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center">
              <Store className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Shopify Integration
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Upload optimized images directly to your store
              </p>
            </div>
          </div>
        </div>
        <div className="p-4">
          <ShopifyPanelContent />
        </div>
      </div>
    </ShopifyProvider>
  );
}

export default ShopifyPanel;
