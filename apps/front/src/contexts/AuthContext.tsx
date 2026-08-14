import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { ping } from "../api/auth";

type AuthState = {
  isAuthenticated: boolean;
  isLoading: boolean;
  recheck: () => void;
};

const AuthContext = createContext<AuthState>({
  isAuthenticated: false,
  isLoading: true,
  recheck: () => {},
});

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ isAuthenticated: boolean; isLoading: boolean }>({
    isAuthenticated: false,
    isLoading: true,
  });

  const recheck = useCallback(() => {
    ping()
      .then(() => setState({ isAuthenticated: true, isLoading: false }))
      .catch(() => setState({ isAuthenticated: false, isLoading: false }));
  }, []);

  useEffect(() => {
    recheck();
  }, [recheck]);

  return <AuthContext.Provider value={{ ...state, recheck }}>{children}</AuthContext.Provider>;
}
