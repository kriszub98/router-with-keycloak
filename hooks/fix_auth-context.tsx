import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import keycloak, {
  initKeycloakOnce,
  login as kcLogin,
  logout as kcLogout,
} from "utils/keycloak";

type AuthValue = {
  ready: boolean; // czy initKeycloak już się wykonał
  authenticated: boolean;
  login: (to?: string) => void;
  logout: (to?: string) => void;
};

const AuthCtx = createContext<AuthValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const auth = await initKeycloakOnce();
        if (!mounted) return;
        setAuthenticated(!!auth);
      } finally {
        if (mounted) setReady(true);
      }
    })();

    keycloak.onAuthSuccess = () => setAuthenticated(true);
    keycloak.onAuthLogout = () => setAuthenticated(false);

    return () => {
      mounted = false;
    };
  }, []);

  const value: AuthValue = {
    ready,
    authenticated,
    login: kcLogin,
    logout: kcLogout,
  };
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { ready, authenticated, login } = useAuth();

  // Poczekaj aż initKeycloak się wykona (unikniesz błędu i migotania)
  if (!ready) return <div>Ładowanie…</div>;

  // Jeśli niezalogowany — uruchom login w efekcie (nie podczas renderu)
  const triedRef = useRef(false);
  useEffect(() => {
    if (ready && !authenticated && !triedRef.current) {
      triedRef.current = true;
      login(window.location.href);
    }
  }, [ready, authenticated, login]);

  if (!authenticated) return <div>Przekierowanie do logowania…</div>;

  return <>{children}</>;
}
