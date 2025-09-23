import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import keycloak, {
  initKeycloak,
  getAccessToken,
  getProfile,
  login as kcLogin,
  logout as kcLogout,
  hasRole,
} from "./keycloak";

interface AuthState {
  ready: boolean;
  authenticated: boolean;
  token: string | null;
  profile: import("keycloak-js").KeycloakProfile | null;
}

const AuthCtx = createContext<{
  state: AuthState;
  login: (to?: string) => void;
  logout: (to?: string) => void;
  hasRole: (r: string) => boolean;
}>({
  state: { ready: false, authenticated: false, token: null, profile: null },
  login: () => {},
  logout: () => {},
  hasRole: () => false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    ready: false,
    authenticated: false,
    token: null,
    profile: null,
  });

  useEffect(() => {
    (async () => {
      const authenticated = await initKeycloak();
      const token = getAccessToken();
      const profile = authenticated ? await getProfile() : null;
      if (!profile) return;
      setState({ ready: true, authenticated, token, profile });

      keycloak.onAuthSuccess = async () => {
        const token = getAccessToken();
        const profile = await getProfile();
        setState((s) => ({
          ...s,
          authenticated: true,
          token,
          profile: profile ?? null,
        }));
      };
      keycloak.onAuthLogout = () =>
        setState({
          ready: true,
          authenticated: false,
          token: null,
          profile: null,
        });
      keycloak.onTokenExpired = () => keycloak.updateToken(60);
    })();
  }, []);

  const value = useMemo(
    () => ({
      state,
      login: kcLogin,
      logout: kcLogout,
      hasRole,
    }),
    [state]
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  return useContext(AuthCtx);
}

export function RequireAuth({
  children,
  role,
}: {
  children: React.ReactNode;
  role?: string;
}) {
  const { state, login, hasRole } = useAuth();

  if (!state.ready) return <div className="p-8">Loading auth…</div>;
  if (!state.authenticated) {
    login(window.location.href);
    return <div className="p-8">Redirecting to login…</div>;
  }
  if (role && !hasRole(role)) {
    return <div className="p-8">You do not have access to this section.</div>;
  }
  return <>{children}</>;
}
