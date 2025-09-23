import Keycloak from "keycloak-js";
import type {
  KeycloakInitOptions,
  KeycloakProfile,
  KeycloakTokenParsed,
} from "keycloak-js";

const keycloak = new Keycloak({
  url: import.meta.env.VITE_KEYCLOAK_URL,
  realm: import.meta.env.VITE_KEYCLOAK_REALM,
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID,
});

let refreshTimer: number | null = null;

export async function initKeycloak(options: KeycloakInitOptions = {}) {
  const authenticated = await keycloak.init({
    onLoad: "check-sso",
    checkLoginIframe: false,
    pkceMethod: "S256",
    silentCheckSsoRedirectUri:
      window.location.origin + "/silent-check-sso.html",
    ...options,
  });

  scheduleTokenRefresh();
  return authenticated;
}

function scheduleTokenRefresh() {
  clearRefresh();
  if (!keycloak.tokenParsed) return;

  const parsed = keycloak.tokenParsed as KeycloakTokenParsed & { exp: number };
  const expiresAt = (parsed.exp ?? 0) * 1000;
  const lead = 30_000; // refresh 30s before expiry
  const ms = Math.max(expiresAt - Date.now() - lead, 5_000);
  refreshTimer = window.setTimeout(async () => {
    try {
      const refreshed = await keycloak.updateToken(60);
      if (refreshed) scheduleTokenRefresh();
    } catch (e) {
      console.warn("Token refresh failed, forcing login", e);
      keycloak.login();
    }
  }, ms);
}

function clearRefresh() {
  if (refreshTimer) window.clearTimeout(refreshTimer);
  refreshTimer = null;
}

export function getAccessToken() {
  return keycloak.token || null;
}

export function getIdToken() {
  return keycloak.idToken || null;
}

export function getProfile(): Promise<KeycloakProfile | undefined> {
  return keycloak.loadUserProfile();
}

export function login(redirectTo?: string) {
  return keycloak.login({ redirectUri: redirectTo ?? window.location.href });
}

export function logout(redirectTo?: string) {
  return keycloak.logout({ redirectUri: redirectTo ?? window.location.origin });
}

export function hasRole(role: string) {
  return (
    keycloak.hasRealmRole(role) ||
    keycloak.resourceAccess?.[keycloak.clientId!]?.roles?.includes(role) ||
    false
  );
}

export default keycloak;
