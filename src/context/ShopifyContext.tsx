/**
 * Shopify Context
 * Global state management for Shopify integration
 */

import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { shopifyApi, ShopifyConnection } from '../services/shopifyApi';

// ==================== Types ====================

interface ShopifyState {
  isAuthenticated: boolean;
  connections: ShopifyConnection[];
  activeConnection: ShopifyConnection | null;
  isLoading: boolean;
  error: string | null;
  oauthStatus: 'idle' | 'connecting' | 'success' | 'error';
  oauthMessage: string | null;
}

type ShopifyAction =
  | { type: 'SET_AUTHENTICATED'; payload: boolean }
  | { type: 'SET_CONNECTIONS'; payload: ShopifyConnection[] }
  | { type: 'SET_ACTIVE_CONNECTION'; payload: ShopifyConnection | null }
  | { type: 'ADD_CONNECTION'; payload: ShopifyConnection }
  | { type: 'REMOVE_CONNECTION'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_OAUTH_STATUS'; payload: { status: ShopifyState['oauthStatus']; message?: string } }
  | { type: 'RESET' };

interface ShopifyContextValue extends ShopifyState {
  refreshConnections: () => Promise<void>;
  connectStore: (shopDomain: string) => Promise<void>;
  disconnectStore: (connectionId: string) => Promise<void>;
  setActiveConnection: (connection: ShopifyConnection | null) => void;
  clearError: () => void;
  clearOAuthStatus: () => void;
}

// ==================== Initial State ====================

const initialState: ShopifyState = {
  isAuthenticated: false,
  connections: [],
  activeConnection: null,
  isLoading: false,
  error: null,
  oauthStatus: 'idle',
  oauthMessage: null,
};

// ==================== Reducer ====================

function shopifyReducer(state: ShopifyState, action: ShopifyAction): ShopifyState {
  switch (action.type) {
    case 'SET_AUTHENTICATED':
      return { ...state, isAuthenticated: action.payload };

    case 'SET_CONNECTIONS':
      return { 
        ...state, 
        connections: action.payload,
        // Auto-select first active connection if none selected
        activeConnection: state.activeConnection || 
          action.payload.find(c => c.status === 'active') || null,
      };

    case 'SET_ACTIVE_CONNECTION':
      return { ...state, activeConnection: action.payload };

    case 'ADD_CONNECTION':
      return { 
        ...state, 
        connections: [...state.connections, action.payload],
        activeConnection: state.activeConnection || action.payload,
      };

    case 'REMOVE_CONNECTION':
      const filtered = state.connections.filter(c => c.id !== action.payload);
      return { 
        ...state, 
        connections: filtered,
        activeConnection: state.activeConnection?.id === action.payload 
          ? filtered.find(c => c.status === 'active') || null
          : state.activeConnection,
      };

    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload };

    case 'SET_OAUTH_STATUS':
      return { 
        ...state, 
        oauthStatus: action.payload.status,
        oauthMessage: action.payload.message || null,
      };

    case 'RESET':
      return initialState;

    default:
      return state;
  }
}

// ==================== Context ====================

const ShopifyContext = createContext<ShopifyContextValue | null>(null);

// ==================== Provider ====================

interface ShopifyProviderProps {
  children: ReactNode;
}

export function ShopifyProvider({ children }: ShopifyProviderProps) {
  const [state, dispatch] = useReducer(shopifyReducer, initialState);

  // Check auth status on mount
  useEffect(() => {
    const isAuth = shopifyApi.isAuthenticated();
    dispatch({ type: 'SET_AUTHENTICATED', payload: isAuth });
  }, []);

  // Check for OAuth callback params on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    
    if (params.get('shopify_connected') === 'true') {
      const shop = params.get('shop');
      dispatch({ 
        type: 'SET_OAUTH_STATUS', 
        payload: { 
          status: 'success', 
          message: `Successfully connected to ${shop}!` 
        } 
      });
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
      // Refresh connections
      refreshConnections();
    } else if (params.get('shopify_error')) {
      dispatch({ 
        type: 'SET_OAUTH_STATUS', 
        payload: { 
          status: 'error', 
          message: params.get('shopify_error') || 'Connection failed' 
        } 
      });
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // Load connections when authenticated
  useEffect(() => {
    if (state.isAuthenticated) {
      refreshConnections();
    }
  }, [state.isAuthenticated]);

  /**
   * Refresh connections from API
   */
  async function refreshConnections() {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const { connections } = await shopifyApi.getConnections();
      dispatch({ type: 'SET_CONNECTIONS', payload: connections });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load connections';
      dispatch({ type: 'SET_ERROR', payload: message });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }

  /**
   * Start OAuth flow to connect a store
   */
  async function connectStore(shopDomain: string) {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_OAUTH_STATUS', payload: { status: 'connecting' } });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const { authUrl } = await shopifyApi.startOAuth(shopDomain);
      // Redirect to Shopify OAuth
      window.location.href = authUrl;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to start connection';
      dispatch({ type: 'SET_ERROR', payload: message });
      dispatch({ type: 'SET_OAUTH_STATUS', payload: { status: 'error', message } });
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }

  /**
   * Disconnect a store
   */
  async function disconnectStore(connectionId: string) {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      await shopifyApi.disconnect(connectionId);
      dispatch({ type: 'REMOVE_CONNECTION', payload: connectionId });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to disconnect';
      dispatch({ type: 'SET_ERROR', payload: message });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }

  /**
   * Set active connection
   */
  function setActiveConnection(connection: ShopifyConnection | null) {
    dispatch({ type: 'SET_ACTIVE_CONNECTION', payload: connection });
  }

  /**
   * Clear error
   */
  function clearError() {
    dispatch({ type: 'SET_ERROR', payload: null });
  }

  /**
   * Clear OAuth status
   */
  function clearOAuthStatus() {
    dispatch({ type: 'SET_OAUTH_STATUS', payload: { status: 'idle' } });
  }

  const value: ShopifyContextValue = {
    ...state,
    refreshConnections,
    connectStore,
    disconnectStore,
    setActiveConnection,
    clearError,
    clearOAuthStatus,
  };

  return (
    <ShopifyContext.Provider value={value}>
      {children}
    </ShopifyContext.Provider>
  );
}

// ==================== Hook ====================

export function useShopify(): ShopifyContextValue {
  const context = useContext(ShopifyContext);
  
  if (!context) {
    throw new Error('useShopify must be used within a ShopifyProvider');
  }
  
  return context;
}

export default ShopifyContext;
