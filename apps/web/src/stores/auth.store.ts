import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserState {
  id: string;
  email: string;
  fullName: string;
  role: string;
  status: string;
}

interface AuthStore {
  user: UserState | null;
  token: string | null;
  setAuth: (user: UserState, token: string) => void;
  clearAuth: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      setAuth: (user, token) => set({ user, token }),
      clearAuth: () => set({ user: null, token: null }),
      isAuthenticated: () => !!get().token,
    }),
    { name: 'mercury-auth' },
  ),
);
