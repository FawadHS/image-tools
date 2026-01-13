// Shared authentication utilities that work across both apps
// (main platform and image-tools subdirectory)

const AUTH_TOKEN_KEY = 'auth-token';
const AUTH_USER_KEY = 'auth-user';
const REFERRER_KEY = 'tools-referrer';

export interface SharedUser {
  id: string;
  email: string;
  fullName: string;
  tier: 'free' | 'pro';
  verified: boolean;
}

/**
 * Get authentication token from localStorage
 * Works across both main platform and image-tools subdirectory
 */
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  
  // Try direct token keys first
  const directToken = localStorage.getItem(AUTH_TOKEN_KEY) || localStorage.getItem('token');
  if (directToken) return directToken;
  
  // Try zustand persist storage (from main platform)
  const authStorage = localStorage.getItem('auth-storage');
  if (authStorage) {
    try {
      const parsed = JSON.parse(authStorage);
      if (parsed.state && parsed.state.token) {
        return parsed.state.token;
      }
    } catch {}
  }
  
  return null;
}

/**
 * Get authenticated user from localStorage
 */
export function getAuthUser(): SharedUser | null {
  if (typeof window === 'undefined') return null;
  
  // Try auth-user first
  const userStr = localStorage.getItem(AUTH_USER_KEY);
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch {}
  }
  
  // Try zustand persist storage (from main platform)
  const authStorage = localStorage.getItem('auth-storage');
  if (authStorage) {
    try {
      const parsed = JSON.parse(authStorage);
      if (parsed.state && parsed.state.user) {
        return parsed.state.user;
      }
    } catch {}
  }
  
  return null;
}

/**
 * Set authentication data (token and user)
 * Stores in a way that's accessible to both apps
 */
export function setAuthData(token: string, user: SharedUser): void {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem('token', token); // Backward compatibility
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

/**
 * Clear authentication data
 */
export function clearAuthData(): void {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem('token');
  localStorage.removeItem(AUTH_USER_KEY);
  localStorage.removeItem('auth-storage'); // Clear zustand persist
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return !!getAuthToken();
}

/**
 * Save referrer for dynamic navigation
 * Used to remember where user came from (dashboard, landing, etc.)
 */
export function saveReferrer(path: string): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(REFERRER_KEY, path);
}

/**
 * Get saved referrer
 */
export function getReferrer(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(REFERRER_KEY);
}

/**
 * Clear saved referrer
 */
export function clearReferrer(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(REFERRER_KEY);
}

/**
 * Get back button destination based on referrer
 */
export function getBackButtonDestination(): { label: string; url: string } {
  const referrer = getReferrer();
  
  if (referrer === 'dashboard') {
    return {
      label: 'Back to Dashboard',
      url: '/dashboard'
    };
  }
  
  return {
    label: 'Back to Tools',
    url: '/'
  };
}
