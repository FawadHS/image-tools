/**
 * Shopify API Service
 * API client for Shopify integration endpoints
 * Includes automatic token refresh for seamless authentication
 */

// API base URL - uses same API as fawadhs-tools platform
const API_URL = import.meta.env.VITE_API_URL || 'https://api.tools.fawadhs.dev';
const PLATFORM_URL = import.meta.env.VITE_PLATFORM_URL || 'https://tools.fawadhs.dev';

// Track if we're currently refreshing to prevent multiple refresh calls
let isRefreshing = false;
let refreshPromise: Promise<string> | null = null;

/**
 * Get tokens from localStorage (shared with main platform)
 */
function getTokens(): { accessToken: string | null; refreshToken: string | null } {
  try {
    const accessToken = localStorage.getItem('token');
    const refreshToken = localStorage.getItem('refreshToken');
    
    // Also try Zustand persist store if direct keys not available
    if (!accessToken || !refreshToken) {
      const authStore = localStorage.getItem('auth-storage');
      if (authStore) {
        const parsed = JSON.parse(authStore);
        return {
          accessToken: accessToken || parsed?.state?.token || null,
          refreshToken: refreshToken || parsed?.state?.refreshToken || null,
        };
      }
    }
    
    return { accessToken, refreshToken };
  } catch {
    return { accessToken: null, refreshToken: null };
  }
}

/**
 * Get auth token (backward compatible)
 */
function getAuthToken(): string | null {
  return getTokens().accessToken;
}

/**
 * Update tokens in all storage locations
 */
function setTokens(accessToken: string, refreshToken?: string): void {
  localStorage.setItem('token', accessToken);
  if (refreshToken) {
    localStorage.setItem('refreshToken', refreshToken);
  }
  
  // Also update Zustand persist store for sync with main platform
  try {
    const authStorage = localStorage.getItem('auth-storage');
    if (authStorage) {
      const parsed = JSON.parse(authStorage);
      if (parsed?.state) {
        parsed.state.token = accessToken;
        if (refreshToken) {
          parsed.state.refreshToken = refreshToken;
        }
        localStorage.setItem('auth-storage', JSON.stringify(parsed));
      }
    }
  } catch {
    // Ignore errors
  }
}

/**
 * Clear all auth data
 */
function clearAuth(): void {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('auth-storage');
}

/**
 * Redirect to platform login
 */
function redirectToLogin(): void {
  const returnUrl = encodeURIComponent(window.location.href);
  window.location.href = `${PLATFORM_URL}/login?redirect=${returnUrl}`;
}

/**
 * Attempt to refresh the access token
 */
async function refreshAccessToken(): Promise<string> {
  // If already refreshing, wait for that to complete
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }
  
  isRefreshing = true;
  
  refreshPromise = (async () => {
    try {
      const { refreshToken } = getTokens();
      
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }
      
      const response = await fetch(`${API_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Token refresh failed');
      }
      
      const data = await response.json();
      const newAccessToken = data.accessToken;
      const newRefreshToken = data.refreshToken;
      
      if (!newAccessToken) {
        throw new Error('No access token in refresh response');
      }
      
      setTokens(newAccessToken, newRefreshToken);
      return newAccessToken;
      
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();
  
  return refreshPromise;
}

/**
 * Make authenticated API request with automatic token refresh
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const makeRequest = async () => {
    const token = getAuthToken();
    
    if (!token) {
      throw new Error('Not authenticated. Please login first.');
    }

    return fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });
  };

  let response = await makeRequest();

  // Handle 401 - attempt token refresh
  if (response.status === 401) {
    try {
      await refreshAccessToken();
      // Retry the request with new token
      response = await makeRequest();
    } catch {
      // Refresh failed - redirect to login
      clearAuth();
      redirectToLogin();
      throw new Error('Session expired. Please login again.');
    }
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

// ==================== Types ====================

export interface ShopifyConnection {
  id: string;
  shopDomain: string;
  shopName: string;
  status: 'active' | 'disconnected' | 'expired' | 'error';
  connectedAt: string;
  lastSyncAt: string | null;
}

export interface StagedUploadTarget {
  url: string;
  resourceUrl: string;
  parameters: Array<{ name: string; value: string }>;
}

export interface StagedUploadResponse {
  jobId: string;
  stagedTargets: StagedUploadTarget[];
}

export interface ShopifyProduct {
  id: string;
  title: string;
  handle: string;
  status: string;
  featuredImage?: {
    url: string;
    altText?: string;
  };
  variants: Array<{
    id: string;
    title: string;
    sku?: string;
    price: string;
  }>;
}

export interface ProductSearchResponse {
  products: ShopifyProduct[];
  hasMore: boolean;
}

// ==================== SKU Mapping Types ====================

export type PatternType = 'sku-prefix' | 'sku-suffix' | 'handle' | 'sku-anywhere' | 'custom';
export type SeparatorType = '-' | '_' | '.';
export type PositionIndicator = 'number' | 'front' | 'back' | 'side' | 'detail' | 'none';

export interface SkuMappingConfig {
  pattern: PatternType;
  separator: SeparatorType;
  customRegex?: string;
  extractPosition: boolean;
}

export interface ParsedFilename {
  originalFilename: string;
  identifier: string | null;
  position: number | null;
  viewAngle: PositionIndicator;
  extension: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface ProductInfo {
  id: string;
  title: string;
  handle: string;
  sku: string | null;
  featuredImage: string | null;
}

export interface SkuMatchResult {
  filename: string;
  parsed: ParsedFilename;
  matched: boolean;
  product: ProductInfo | null;
  matchType: 'sku' | 'handle' | 'manual' | null;
}

export interface SkuMappingResponse {
  results: SkuMatchResult[];
  summary: {
    total: number;
    matched: number;
    unmatched: number;
    byMatchType: Record<string, number>;
  };
}

// ==================== API Methods ====================

export const shopifyApi = {
  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!getAuthToken();
  },

  /**
   * List all connected Shopify stores
   */
  async getConnections(): Promise<{ connections: ShopifyConnection[] }> {
    return apiRequest('/api/shopify/connections');
  },

  /**
   * Get single connection details
   */
  async getConnection(connectionId: string): Promise<{ connection: ShopifyConnection }> {
    return apiRequest(`/api/shopify/connections/${connectionId}`);
  },

  /**
   * Start OAuth flow to connect a Shopify store
   */
  async startOAuth(shopDomain: string): Promise<{ authUrl: string; state: string }> {
    return apiRequest('/api/shopify/auth/install', {
      method: 'POST',
      body: JSON.stringify({ shopDomain }),
    });
  },

  /**
   * Disconnect a Shopify store
   */
  async disconnect(connectionId: string): Promise<{ success: boolean; message: string }> {
    return apiRequest('/api/shopify/auth/disconnect', {
      method: 'POST',
      body: JSON.stringify({ connectionId }),
    });
  },

  /**
   * Create staged upload targets for files
   */
  async createStagedUploads(
    connectionId: string,
    files: Array<{ filename: string; mimeType: string; fileSize: number }>
  ): Promise<StagedUploadResponse> {
    return apiRequest('/api/shopify/upload/staged', {
      method: 'POST',
      body: JSON.stringify({ connectionId, files }),
    });
  },

  /**
   * Upload file to staged URL
   * For POST method, use multipart form-data with all parameters
   */
  async uploadToStaged(
    stagedTarget: StagedUploadTarget,
    file: Blob,
    filename: string
  ): Promise<string> {
    // Build FormData with parameters from Shopify
    const formData = new FormData();
    
    // Add all parameters from Shopify (order matters!)
    for (const param of stagedTarget.parameters) {
      formData.append(param.name, param.value);
    }
    
    // Add file last with proper filename
    formData.append('file', file, filename);

    const response = await fetch(stagedTarget.url, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error('[Shopify Upload] Staged upload failed:', response.status, errorText);
      throw new Error(`Upload failed: ${response.status}`);
    }

    // Return the resourceUrl for completing the upload
    return stagedTarget.resourceUrl;
  },

  /**
   * Complete file upload by creating the file in Shopify
   */
  async completeUpload(
    connectionId: string,
    resourceUrl: string,
    filename: string,
    altText?: string
  ): Promise<{ fileId: string }> {
    return apiRequest('/api/shopify/upload/complete', {
      method: 'POST',
      body: JSON.stringify({ connectionId, resourceUrl, filename, altText }),
    });
  },

  /**
   * Search products by query (fuzzy search - matches partial title, SKU, handle)
   */
  async searchProducts(
    connectionId: string,
    query: string,
    limit: number = 20
  ): Promise<ProductSearchResponse> {
    const params = new URLSearchParams({
      connectionId,
      query,
      limit: limit.toString(),
    });
    return apiRequest(`/api/shopify/products/search?${params}`);
  },

  /**
   * List all products with pagination (for browse modal)
   */
  async listProducts(
    connectionId: string,
    limit: number = 20,
    cursor?: string
  ): Promise<ProductSearchResponse & { endCursor: string | null }> {
    const params = new URLSearchParams({
      connectionId,
      limit: limit.toString(),
    });
    if (cursor) {
      params.append('cursor', cursor);
    }
    return apiRequest(`/api/shopify/products?${params}`);
  },

  /**
   * Get a single product by ID
   */
  async getProduct(
    connectionId: string,
    productId: string
  ): Promise<{ product: ShopifyProduct }> {
    const params = new URLSearchParams({ connectionId });
    return apiRequest(`/api/shopify/products/${encodeURIComponent(productId)}?${params}`);
  },

  /**
   * Attach media to a product
   */
  async attachMediaToProduct(
    connectionId: string,
    productId: string,
    mediaUrls: string[]
  ): Promise<{ productId: string; mediaCount: number }> {
    return apiRequest('/api/shopify/products/attach-media', {
      method: 'POST',
      body: JSON.stringify({ connectionId, productId, mediaIds: mediaUrls }),
    });
  },

  // ==================== SKU Mapping Methods ====================

  /**
   * Parse filenames to extract identifiers (no product matching)
   */
  async parseFilenames(
    filenames: string[],
    config: SkuMappingConfig
  ): Promise<{ parsed: ParsedFilename[] }> {
    return apiRequest('/api/shopify/sku-mapping/parse', {
      method: 'POST',
      body: JSON.stringify({ filenames, config }),
    });
  },

  /**
   * Map filenames to products (full SKU matching)
   */
  async mapFilesToProducts(
    connectionId: string,
    filenames: string[],
    config: SkuMappingConfig
  ): Promise<SkuMappingResponse> {
    return apiRequest('/api/shopify/sku-mapping/match', {
      method: 'POST',
      body: JSON.stringify({ connectionId, filenames, config }),
    });
  },

  /**
   * Build product index (get stats)
   */
  async buildProductIndex(
    connectionId: string
  ): Promise<{ skuCount: number; handleCount: number; productCount: number }> {
    const params = new URLSearchParams({ connectionId });
    return apiRequest(`/api/shopify/sku-mapping/index?${params}`);
  },
};

export default shopifyApi;
