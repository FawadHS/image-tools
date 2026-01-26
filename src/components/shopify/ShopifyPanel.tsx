/**
 * Shopify Panel Component
 * Main Shopify integration UI in the settings area
 */

import { ShopifyProvider } from '../../context/ShopifyContext';
import { ShopifyConnect } from './ShopifyConnect';
import { ShopifyUploader } from './ShopifyUploader';
import { SkuMapper } from './SkuMapper';
import { useShopify } from '../../context/ShopifyContext';
import { useConverter } from '../../context/ConverterContext';
import { Store, Upload, Crown, ExternalLink, FileStack } from 'lucide-react';
import { useState } from 'react';
import type { SkuMatchResult } from '../../services/shopifyApi';
import type { SelectedFile } from '../../types';

type TabType = 'connect' | 'upload' | 'bulk';

function ShopifyPanelContent() {
  const { connections } = useShopify();
  const { state: converterState } = useConverter();
  const [activeTab, setActiveTab] = useState<TabType>('connect');
  const [showSkuMapper, setShowSkuMapper] = useState(false);
  const [skuMappingResults, setSkuMappingResults] = useState<SkuMatchResult[] | null>(null);

  const hasActiveConnection = connections.some(c => c.status === 'active');
  
  // Get completed files
  const completedFiles: SelectedFile[] = converterState.files.filter(
    (f: SelectedFile) => f.status === 'completed' && f.result
  );
  const filenames = completedFiles.map((f: SelectedFile) => f.result!.filename);

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
          <button
            onClick={() => setActiveTab('bulk')}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'bulk'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <FileStack className="w-4 h-4" />
            Bulk SKU
          </button>
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'connect' && <ShopifyConnect />}
      {activeTab === 'upload' && hasActiveConnection && <ShopifyUploader />}
      {activeTab === 'bulk' && hasActiveConnection && (
        <div className="space-y-4">
          {/* Bulk SKU Upload Info */}
          {!showSkuMapper && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                Bulk SKU Upload
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Upload multiple images and automatically match them to products 
                using SKU or product handle patterns in filenames.
              </p>
              <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1 mb-4">
                <p>• <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">SKU-12345.jpg</code> → matches product with SKU "12345"</p>
                <p>• <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">red-sneakers.jpg</code> → matches product handle "red-sneakers"</p>
                <p>• <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">ABC123_1.jpg</code> → matches SKU with position 1</p>
              </div>
              
              {completedFiles.length > 0 ? (
                <button
                  onClick={() => setShowSkuMapper(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <FileStack className="w-4 h-4" />
                  Start SKU Mapping ({completedFiles.length} files)
                </button>
              ) : (
                <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No converted images available. Convert images first to use SKU mapping.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* SKU Mapper */}
          {showSkuMapper && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div 
                className="absolute inset-0 bg-black/50" 
                onClick={() => setShowSkuMapper(false)}
              />
              <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col">
                <SkuMapper
                  filenames={filenames}
                  onMappingComplete={(results) => {
                    setSkuMappingResults(results);
                    setShowSkuMapper(false);
                    // TODO: Proceed to upload with mappings
                    console.log('[ShopifyPanel] SKU mapping complete:', results);
                  }}
                  onCancel={() => setShowSkuMapper(false)}
                />
              </div>
            </div>
          )}

          {/* Mapping Results (after mapping is complete) */}
          {skuMappingResults && !showSkuMapper && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  Mapping Complete
                </h4>
                <button
                  onClick={() => setSkuMappingResults(null)}
                  className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  Clear
                </button>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="text-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    {skuMappingResults.length}
                  </div>
                  <div className="text-xs text-gray-500">Total</div>
                </div>
                <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-lg font-bold text-green-600 dark:text-green-400">
                    {skuMappingResults.filter(r => r.matched).length}
                  </div>
                  <div className="text-xs text-green-600 dark:text-green-400">Matched</div>
                </div>
                <div className="text-center p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <div className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                    {skuMappingResults.filter(r => !r.matched).length}
                  </div>
                  <div className="text-xs text-yellow-600 dark:text-yellow-400">Unmatched</div>
                </div>
              </div>
              <button
                onClick={() => {
                  // TODO: Implement upload with mappings
                  alert('Bulk upload with mappings coming soon!');
                }}
                disabled={skuMappingResults.filter(r => r.matched).length === 0}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
              >
                <Upload className="w-4 h-4" />
                Upload {skuMappingResults.filter(r => r.matched).length} Matched Images
              </button>
            </div>
          )}
        </div>
      )}
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
