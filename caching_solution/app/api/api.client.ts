function getAccessToken(): string {
  // Przykład testowy.
  // Docelowo pobierz token z mechanizmu autoryzacji aplikacji.
  return "demo-access-token";
}

export async function apiFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const headers = new Headers(init?.headers);

  headers.set("Authorization", `Bearer ${getAccessToken()}`);

  return fetch(input, {
    ...init,
    headers,

    // Możesz pozostawić, jeżeli oprócz tokenu
    // korzystasz również z cookies.
    credentials: "include",
  });
}
