import { useEffect, useMemo, useRef, useState } from "react";
import { useInfiniteSearch } from "~/hooks/useInfiniteSearch";
// import { useAuth } from "~/AuthContext"; // jeśli chcesz enabled=ready && isAuthenticated

type Item = { id: number; name: string };

type Filters = {
  term: string; // np. pole wyszukiwarki
  category?: string; // przykładowy dodatkowy filtr
};

// pomocnicza serializacja query do QS
function toQueryString(params: Record<string, string | number | undefined>) {
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== "") usp.set(k, String(v));
  });
  return usp.toString();
}

export function SearchWithInfinite() {
  // 1) Lokalne filtry (edytowalne bez requestów)
  const [filters, setFilters] = useState<Filters>({ term: "", category: "" });

  // 2) Applied query – zmieniasz TYLKO po kliknięciu „Szukaj”
  const [appliedQuery, setAppliedQuery] = useState<Filters>({
    term: "",
    category: "",
  });

  // const { ready, isAuthenticated } = useAuth();
  const enabled = true; // lub: ready && isAuthenticated

  // 3) Funkcja budująca URL dla danej strony
  const buildUrl = useMemo(() => {
    return (q: Filters, page: number) => {
      const qs = toQueryString({
        term: q.term,
        category: q.category,
        page, // 0-based
        size: 20, // rozmiar strony (dostosuj)
      });
      return `/api/items/search?${qs}`;
    };
  }, []);

  // 4) Mapowanie odpowiedzi serwera (jeśli inne klucze)
  // Zakładamy, że API zwraca { items: Item[], page: number, totalPages: number }
  const mapResponse = (raw: unknown) => {
    const r = raw as {
      content?: Item[];
      items?: Item[];
      page: number;
      totalPages: number;
    };
    const items = r.items ?? r.content ?? [];
    return { items, page: r.page, totalPages: r.totalPages };
  };

  // 5) Hook infinite search – odpala się TYLKO, gdy appliedQuery się zmieni
  const { items, loading, error, hasMore, loadMore } = useInfiniteSearch<
    Filters,
    Item
  >({
    query: appliedQuery,
    buildUrl,
    enabled,
    initialPage: 0,
    mapResponse,
  });

  // 6) Sentinel do auto-dociągania
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!enabled || !sentinelRef.current) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: "200px" }
    );
    io.observe(sentinelRef.current);
    return () => io.disconnect();
  }, [enabled, loadMore]);

  // 7) Handlery
  const applySearch = () => setAppliedQuery(filters);

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: 16 }}>
      <h2>Wyszukiwanie (po kliknięciu „Szukaj”) + Infinite</h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 200px 120px",
          gap: 8,
          marginBottom: 12,
        }}
      >
        <input
          placeholder="Szukaj…"
          value={filters.term}
          onChange={(e) => setFilters((f) => ({ ...f, term: e.target.value }))}
        />
        <select
          value={filters.category}
          onChange={(e) =>
            setFilters((f) => ({ ...f, category: e.target.value }))
          }
        >
          <option value="">Wszystkie kategorie</option>
          <option value="a">A</option>
          <option value="b">B</option>
        </select>
        <button type="button" onClick={applySearch}>
          Szukaj
        </button>
      </div>

      {error && (
        <div style={{ color: "red", marginBottom: 8 }}>Błąd: {error}</div>
      )}

      <ul style={{ listStyle: "none", padding: 0 }}>
        {items.map((it) => (
          <li
            key={it.id}
            style={{ border: "1px solid #eee", marginBottom: 6, padding: 8 }}
          >
            {it.id}. {it.name}
          </li>
        ))}
      </ul>

      {loading && <div>Ładowanie…</div>}
      {!hasMore && !loading && (
        <div style={{ color: "#666" }}>To już wszystko ✅</div>
      )}

      {/* sentinel */}
      <div ref={sentinelRef} style={{ height: 1 }} />
    </div>
  );
}
