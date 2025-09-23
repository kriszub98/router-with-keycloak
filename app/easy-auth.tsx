import React, { createContext, useContext, useEffect, useState } from "react";
import keycloak, {
  initKeycloak,
  login as kcLogin,
  logout as kcLogout,
} from "./keycloak";

const AuthCtx = createContext({
  authenticated: false,
  login: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    (async () => {
      const auth = await initKeycloak();
      setAuthenticated(auth);
    })();
  }, []);

  return (
    <AuthCtx.Provider
      value={{ authenticated, login: kcLogin, logout: kcLogout }}
    >
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  return useContext(AuthCtx);
}

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { authenticated, login } = useAuth();
  if (!authenticated) {
    login();
    return <div>Redirecting to login…</div>;
  }
  return <>{children}</>;
}
