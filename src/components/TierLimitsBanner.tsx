/**
 * TierLimitsBanner - Shows current user tier and limits
 * Displays contextual limits based on login status and subscription tier
 */

import { useState, useEffect } from 'react';
import { Zap, Crown, ExternalLink, X, ChevronDown, ChevronUp } from 'lucide-react';

interface TierLimits {
  conversionsPerDay: number;
  imagesPerConversion: number;
  maxFileSizeMB: number;
  shopifyStores: number;
  shopifyUploads: string;
}

const TIER_LIMITS: Record<string, TierLimits> = {
  free: {
    conversionsPerDay: 50,
    imagesPerConversion: 10,
    maxFileSizeMB: 10,
    shopifyStores: 0,
    shopifyUploads: 'Not included',
  },
  pro: {
    conversionsPerDay: 1000,
    imagesPerConversion: 50,
    maxFileSizeMB: 50,
    shopifyStores: 1,
    shopifyUploads: '500/month',
  },
  business: {
    conversionsPerDay: 10000,
    imagesPerConversion: 200,
    maxFileSizeMB: 200,
    shopifyStores: 5,
    shopifyUploads: 'Unlimited',
  },
};

function getUserTier(): string {
  try {
    const authStore = localStorage.getItem('auth-storage');
    if (authStore) {
      const parsed = JSON.parse(authStore);
      return parsed?.state?.user?.tier || parsed?.state?.user?.subscriptionTier || 'free';
    }
  } catch {
    // Ignore parse errors
  }
  return 'free';
}

function isUserAuthenticated(): boolean {
  const directToken = localStorage.getItem('token');
  if (directToken) return true;
  
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

export function TierLimitsBanner() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [tier, setTier] = useState('free');

  useEffect(() => {
    setIsAuthenticated(isUserAuthenticated());
    setTier(getUserTier());
    
    // Check if dismissed in this session
    const dismissed = sessionStorage.getItem('tier-banner-dismissed');
    if (dismissed) setIsDismissed(true);
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('tier-banner-dismissed', 'true');
  };

  if (isDismissed) return null;

  const limits = TIER_LIMITS[tier] || TIER_LIMITS.free;

  // Unauthenticated users - show sign up prompt
  if (!isAuthenticated) {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                Using Free Mode
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {limits.imagesPerConversion} images/batch • {limits.maxFileSizeMB}MB max • No Shopify
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="https://tools.fawadhs.dev/register"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Sign Up Free
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <button
              onClick={handleDismiss}
              className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Free tier - show upgrade prompt
  if (tier === 'free') {
    return (
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gray-500 flex items-center justify-center flex-shrink-0">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                Free Plan
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {limits.imagesPerConversion} images/batch • {limits.maxFileSizeMB}MB max • No Shopify
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="https://tools.fawadhs.dev/pricing"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Upgrade
              <Crown className="w-3.5 h-3.5" />
            </a>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              aria-label="Toggle details"
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            <button
              onClick={handleDismiss}
              className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-amber-200 dark:border-amber-700">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div className="text-center p-2 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                <div className="font-bold text-gray-900 dark:text-white">{limits.conversionsPerDay}</div>
                <div className="text-xs text-gray-500">Conversions/day</div>
              </div>
              <div className="text-center p-2 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                <div className="font-bold text-gray-900 dark:text-white">{limits.imagesPerConversion}</div>
                <div className="text-xs text-gray-500">Images/batch</div>
              </div>
              <div className="text-center p-2 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                <div className="font-bold text-gray-900 dark:text-white">{limits.maxFileSizeMB}MB</div>
                <div className="text-xs text-gray-500">Max file size</div>
              </div>
              <div className="text-center p-2 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                <div className="font-bold text-gray-400">—</div>
                <div className="text-xs text-gray-500">Shopify</div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Pro/Business tier - show current limits with satisfaction
  return (
    <div className={`bg-gradient-to-r ${
      tier === 'business' 
        ? 'from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border-yellow-200 dark:border-yellow-800'
        : 'from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 border-cyan-200 dark:border-cyan-800'
    } border rounded-xl p-4 mb-6`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg ${
            tier === 'business' ? 'bg-yellow-500' : 'bg-cyan-500'
          } flex items-center justify-center flex-shrink-0`}>
            {tier === 'business' ? (
              <Crown className="w-5 h-5 text-white" />
            ) : (
              <Zap className="w-5 h-5 text-white" />
            )}
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white capitalize">
              {tier} Plan
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {limits.imagesPerConversion} images/batch • {limits.maxFileSizeMB}MB max • {limits.shopifyStores} Shopify store{limits.shopifyStores !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="Toggle details"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button
            onClick={handleDismiss}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
            <div className="text-center p-2 bg-white/50 dark:bg-gray-800/50 rounded-lg">
              <div className="font-bold text-gray-900 dark:text-white">{limits.conversionsPerDay.toLocaleString()}</div>
              <div className="text-xs text-gray-500">Conversions/day</div>
            </div>
            <div className="text-center p-2 bg-white/50 dark:bg-gray-800/50 rounded-lg">
              <div className="font-bold text-gray-900 dark:text-white">{limits.imagesPerConversion}</div>
              <div className="text-xs text-gray-500">Images/batch</div>
            </div>
            <div className="text-center p-2 bg-white/50 dark:bg-gray-800/50 rounded-lg">
              <div className="font-bold text-gray-900 dark:text-white">{limits.maxFileSizeMB}MB</div>
              <div className="text-xs text-gray-500">Max file size</div>
            </div>
            <div className="text-center p-2 bg-white/50 dark:bg-gray-800/50 rounded-lg">
              <div className="font-bold text-gray-900 dark:text-white">{limits.shopifyStores}</div>
              <div className="text-xs text-gray-500">Shopify stores</div>
            </div>
            <div className="text-center p-2 bg-white/50 dark:bg-gray-800/50 rounded-lg">
              <div className="font-bold text-gray-900 dark:text-white">{limits.shopifyUploads}</div>
              <div className="text-xs text-gray-500">Shopify uploads</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TierLimitsBanner;
