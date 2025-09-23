// HomePage.tsx
import { useFetch } from "hooks/useFetch";
import { useMemo } from "react";
import { useAuth } from "~/newAuth";

type DashboardData = {
  /* ... */
};

export function HomePage() {
  const { ready, isAuthenticated, token } = useAuth();

  const url = isAuthenticated ? "/api/dashboard" : "";

  const options = useMemo<RequestInit | undefined>(() => {
    if (!token) return undefined;
    return {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    };
  }, [token]);

  const { data, loading, error } = useFetch<DashboardData>(url, options, {
    // nie startuj fetch dopóki nie mamy wszystkiego
    skip: !ready || !isAuthenticated || !token,
    // stabilne deps (zmieniaj tylko wtedy, gdy realnie trzeba odświeżyć request)
    deps: [token], // albo np. [token, someFilter, page]
  });

  if (!ready) return <div>Ładowanie…</div>;
  if (!isAuthenticated) return <div>Proszę się zalogować.</div>;
  if (loading) return <div>Wczytywanie danych…</div>;
  if (error) return <div>Błąd: {error}</div>;
  if (!data) return <div>Brak danych.</div>;

  return <pre>{JSON.stringify(data, null, 2)}</pre>;
}
