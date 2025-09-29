import { useSearch } from "hooks/useSearch";

type Item = { id: number; name: string };

export function SearchBox() {
  const {
    query,
    setQuery,
    results,
    loading,
    error,
    isFiltered,
    refetchInitial,
  } = useSearch<Item>({
    initialUrl: "/api/items", // pełna lista na start
    searchUrl: (q) => `/api/items?filter=${encodeURIComponent(q)}`, // filtrowanie na serwerze
    minChars: 3,
    debounceMs: 300,
    enabled: true, // lub: ready && isAuthenticated (z Twojego AuthContextu)
    // mapResponse: (raw) => (raw as any).items, // jeżeli API zwraca np. { items: [...] }
  });

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", padding: 16 }}>
      <input
        type="text"
        placeholder="Szukaj (min. 3 znaki)…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{ width: "100%", padding: 8, marginBottom: 8 }}
      />

      <div style={{ marginBottom: 8, fontSize: 12, color: "#555" }}>
        {isFiltered ? "Wyniki filtrowane" : "Pełna lista"}
        {" · "}
        <button type="button" onClick={refetchInitial}>
          Odśwież pełną listę
        </button>
      </div>

      {loading && <div>⏳ Ładowanie…</div>}
      {error && <div style={{ color: "red" }}>Błąd: {error}</div>}

      <ul style={{ listStyle: "none", padding: 0 }}>
        {results.map((r) => (
          <li key={r.id} style={{ borderBottom: "1px solid #eee", padding: 8 }}>
            {r.name}
          </li>
        ))}
      </ul>
    </div>
  );
}
