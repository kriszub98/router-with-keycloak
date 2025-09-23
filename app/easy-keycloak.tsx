import Keycloak from "keycloak-js";

const keycloak = new Keycloak({
  url: import.meta.env.VITE_KEYCLOAK_URL,
  realm: import.meta.env.VITE_KEYCLOAK_REALM,
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID,
});

export async function initKeycloak() {
  return keycloak.init({ onLoad: "check-sso", pkceMethod: "S256" });
}

export function login() {
  keycloak.login();
}

export function logout() {
  keycloak.logout();
}

export function getToken() {
  return keycloak.token;
}

export default keycloak;
