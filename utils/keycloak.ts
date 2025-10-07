import Keycloak from "keycloak-js";

const keycloak = new Keycloak({
  url: import.meta.env.VITE_KEYCLOAK_URL,
  realm: import.meta.env.VITE_KEYCLOAK_REALM,
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID,
});

let __kcInitPromise: Promise<boolean> | null = null;
let __kcInitStarted = false;

export async function initKeycloakOnce() {
  if (__kcInitPromise) return __kcInitPromise;
  if (__kcInitStarted) return Promise.resolve(!!keycloak.token);
  __kcInitStarted = true;
  __kcInitPromise = keycloak
    .init({
      onLoad: "check-sso",
      pkceMethod: "S256",
      checkLoginIframe: false,
      silentCheckSsoRedirectUri:
        window.location.origin + "/silent-check-sso.html",
    })
    .catch((e) => {
      // nie pozwól, żeby błąd inicjalizacji ubił całą aplikację
      console.error("Keycloak init failed:", e);
      return false;
    });
  return __kcInitPromise;
}

export function login(redirectTo?: string) {
  keycloak.login({ redirectUri: redirectTo ?? window.location.href });
}

export function logout(redirectTo?: string) {
  keycloak.logout({ redirectUri: redirectTo ?? window.location.origin });
}

export function getToken() {
  return keycloak.token;
}

export default keycloak;
