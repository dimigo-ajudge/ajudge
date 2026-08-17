import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { getCurrentUser, logout, type CurrentUser } from "../api/auth";

type AuthState = {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: CurrentUser | null;
  recheck: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState>({
  isAuthenticated: false,
  isLoading: true,
  user: null,
  recheck: async () => {},
  signOut: async () => {},
});

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{
    isAuthenticated: boolean;
    isLoading: boolean;
    user: CurrentUser | null;
  }>({
    isAuthenticated: false,
    isLoading: true,
    user: null,
  });

  const recheck = useCallback(async () => {
    try {
      const user = await getCurrentUser();
      setState({ isAuthenticated: true, isLoading: false, user });
    } catch {
      setState({ isAuthenticated: false, isLoading: false, user: null });
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await logout();
    } finally {
      setState({ isAuthenticated: false, isLoading: false, user: null });
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    getCurrentUser()
      .then((user) => {
        if (!cancelled) setState({ isAuthenticated: true, isLoading: false, user });
      })
      .catch(() => {
        if (!cancelled) setState({ isAuthenticated: false, isLoading: false, user: null });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, recheck, signOut }}>{children}</AuthContext.Provider>
  );
}
