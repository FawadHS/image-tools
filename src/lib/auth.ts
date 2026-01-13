// Mirror of shared auth utilities in main platform
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  fullName: string;
  tier: 'free' | 'pro';
  verified: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setAuth: (user, token) => {
        // Store in both localStorage locations for cross-app compatibility
        localStorage.setItem('token', token);
        localStorage.setItem('auth-token', token);
        localStorage.setItem('auth-user', JSON.stringify(user));
        set({ user, token, isAuthenticated: true });
      },
      logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('auth-token');
        localStorage.removeItem('auth-user');
        set({ user: null, token: null, isAuthenticated: false });
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);

// Helper to sync auth state from main platform
export function syncAuthFromStorage() {
  const token = localStorage.getItem('token') || localStorage.getItem('auth-token');
  const userStr = localStorage.getItem('auth-user');
  
  if (token && userStr) {
    try {
      const user = JSON.parse(userStr);
      useAuthStore.getState().setAuth(user, token);
      return true;
    } catch {
      return false;
    }
  }
  return false;
}
