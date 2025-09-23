// AuthContext.tsx
import {
  type ReactNode,
  useEffect,
  useState,
  createContext,
  useContext,
  useRef,
} from "react";
import keycloak from "./keycloak";

type AuthContextType = {
  ready: boolean;
  isAuthenticated: boolean;
  token?: string;
  login: () => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState<string>();
  const refreshTimeout = useRef<number | undefined>(undefined);

  useEffect(() => {
    let isMounted = true;

    const scheduleRefresh = () => {
      if (!keycloak.token || !keycloak.tokenParsed?.exp) return;

      const now = Math.floor(Date.now() / 1000);
      // Odśwież ~60 s przed wygaśnięciem
      const secondsToRefresh = Math.max(
        10,
        keycloak.tokenParsed.exp - now - 60
      );

      window.clearTimeout(refreshTimeout.current);
      refreshTimeout.current = window.setTimeout(async () => {
        try {
          const refreshed = await keycloak.updateToken(70);
          if (refreshed && isMounted) {
            setToken(keycloak.token!);
          }
        } finally {
          // zaplanuj kolejny refresh
          if (isMounted) scheduleRefresh();
        }
      }, secondsToRefresh * 1000);
    };

    keycloak
      .init({ onLoad: "check-sso", pkceMethod: "S256" })
      .then((authenticated) => {
        if (!isMounted) return;
        setIsAuthenticated(authenticated);
        if (authenticated) {
          setToken(keycloak.token!);
          scheduleRefresh();
        }
      })
      .finally(() => {
        if (isMounted) setReady(true);
      });

    keycloak.onAuthSuccess = () => {
      setIsAuthenticated(true);
      setToken(keycloak.token!);
      scheduleRefresh();
    };
    keycloak.onAuthLogout = () => {
      setIsAuthenticated(false);
      setToken(undefined);
      window.clearTimeout(refreshTimeout.current);
    };
    keycloak.onTokenExpired = () => {
      keycloak.updateToken(70).then((refreshed) => {
        if (refreshed) setToken(keycloak.token!);
      });
    };

    return () => {
      isMounted = false;
      window.clearTimeout(refreshTimeout.current);
    };
  }, []);

  const login = () => keycloak.login();
  const logout = () => keycloak.logout();

  return (
    <AuthContext.Provider
      value={{ ready, isAuthenticated, token, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
