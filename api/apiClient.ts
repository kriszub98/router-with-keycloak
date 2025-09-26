// apiClient.ts
import keycloak from "~/easy-keycloak";

async function getFreshToken() {
  if (!keycloak.authenticated) throw new Error("Nie zalogowany");
  // odśwież, jeśli wygasa
  await keycloak.updateToken(60).catch(() => {
    // możesz tu ewentualnie zrobić keycloak.login()
  });
  if (!keycloak.token) throw new Error("Brak tokenu");
  return keycloak.token;
}

export async function apiFetch<T>(url: string, init: RequestInit = {}) {
  const controller = (init as any).signal ? undefined : new AbortController();
  const signal = (init as any).signal ?? controller?.signal;

  const doFetch = async () => {
    const token = await getFreshToken();
    const res = await fetch(url, {
      ...init,
      signal,
      headers: {
        ...(init.headers || {}),
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    return res;
  };

  let res = await doFetch();

  // pojedynczy retry, gdyby token jednak wygasł między odświeżeniem a żądaniem
  if (res.status === 401) {
    await keycloak.updateToken(60).catch(() => {});
    res = await doFetch();
  }

  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<T>;
}
