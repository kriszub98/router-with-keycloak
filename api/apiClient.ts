import keycloak from "~/easy-keycloak";

// apiClient.ts
export async function apiFetch<T>(url: string, init: RequestInit = {}) {
  const token = keycloak.token; // zawsze aktualny
  if (!token) throw new Error("Brak tokenu – użytkownik niezalogowany");

  const res = await fetch(url, {
    ...init,
    headers: {
      ...(init.headers || {}),
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<T>;
}
