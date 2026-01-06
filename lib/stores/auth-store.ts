// lib/stores/auth-store.ts
// Zustand store for authentication state

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AuthUser {
  id: string;
  email: string;
  fullName?: string;
  phone?: string;
  role: 'user' | 'admin' | 'technician';
}

interface AuthState {
  // State
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  pendingEmail: string | null;
  
  // Actions
  setUser: (user: AuthUser | null) => void;
  setLoading: (loading: boolean) => void;
  setPendingEmail: (email: string | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      isLoading: false,
      pendingEmail: null,

      // Actions
      setUser: (user) => set({
        user,
        isAuthenticated: !!user,
      }),

      setLoading: (loading) => set({ isLoading: loading }),

      setPendingEmail: (email) => set({ pendingEmail: email }),

      logout: () => set({
        user: null,
        isAuthenticated: false,
        pendingEmail: null,
      }),
    }),
    {
      name: 'ntf-auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
