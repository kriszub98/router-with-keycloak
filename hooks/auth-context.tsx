import {
  type ReactNode,
  useEffect,
  useState,
  createContext,
  useContext,
} from "react";
import keycloak from "../keycloak";

type AuthContextType = {
  isAuthenticated: boolean;
  token?: string;
  login: () => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState<string>();

  useEffect(() => {
    keycloak
      .init({ onLoad: "check-sso", pkceMethod: "S256" })
      .then((authenticated: boolean) => {
        setIsAuthenticated(authenticated);
        if (authenticated) setToken(keycloak.token!);

        // auto-refresh token
        setInterval(() => {
          keycloak.updateToken(70).then((refreshed: boolean) => {
            if (refreshed) setToken(keycloak.token!);
          });
        }, 6000);
      });
  }, []);

  const login = () => keycloak.login();
  const logout = () => keycloak.logout();

  return (
    <AuthContext.Provider value={{ isAuthenticated, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
