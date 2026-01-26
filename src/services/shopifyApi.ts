/**
 * Shopify API Service
 * API client for Shopify integration endpoints
 */

// API base URL - uses same API as fawadhs-tools platform
const API_URL = import.meta.env.VITE_API_URL || 'https://api.tools.fawadhs.dev';

/**
 * Get auth token from localStorage (shared with main platform)
 */
function getAuthToken(): string | null {
  try {
    const authStore = localStorage.getItem('auth-storage');
    if (authStore) {
      const parsed = JSON.parse(authStore);
      // fawadhs-tools stores token as 'token', not 'accessToken'
      return parsed?.state?.token || null;
    }
  } catch {
    // Ignore parse errors
  }
  return null;
}

/**
 * Make authenticated API request
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error('Not authenticated. Please login first.');
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });

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
   */
  async uploadToStaged(
    stagedTarget: StagedUploadTarget,
    file: Blob
  ): Promise<void> {
    // Build FormData with parameters from Shopify
    const formData = new FormData();
    
    for (const param of stagedTarget.parameters) {
      formData.append(param.name, param.value);
    }
    
    formData.append('file', file);

    const response = await fetch(stagedTarget.url, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status}`);
    }
  },

  /**
   * Search products by query
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
};

export default shopifyApi;
