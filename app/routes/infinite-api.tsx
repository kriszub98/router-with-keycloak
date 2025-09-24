import { useEffect, useMemo, useRef } from "react";
import { useInfiniteList } from "hooks/useInfiniteList";
import { apiFetch } from "api/apiClient";

type User = { id: number; name: string };

export function UsersInfinite() {
  // definiujesz fetchPage
  const fetchPage = useMemo(() => {
    return async (page: number, signal: AbortSignal) => {
      const limit = 10;
      const data = await apiFetch<User[]>(
        `/api/users?page=${page}&limit=${limit}`,
        { signal }
      );

      // jeśli mniej niż limit, to był ostatni pakiet
      const nextPage = data.length < limit ? null : page + 1;
      return { items: data, nextPage };
    };
  }, []);

  const { items, loadMore, loading, hasMore, error } = useInfiniteList<User>({
    fetchPage,
    startPage: 1,
    enabled: true,
  });

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!sentinelRef.current) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        loadMore(); // wywołanie zapytania gdy sentinel widoczny
      }
    });

    observer.observe(sentinelRef.current);

    return () => {
      if (sentinelRef.current) observer.unobserve(sentinelRef.current);
    };
  }, [loadMore]);

  return (
    <div style={{ padding: 16 }}>
      <h1>Lista użytkowników</h1>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {items.map((u) => (
          <li
            key={u.id}
            style={{ border: "1px solid #ddd", margin: "4px 0", padding: 8 }}
          >
            {u.id}. {u.name}
          </li>
        ))}
      </ul>

      {error && <div style={{ color: "red" }}>Błąd: {error}</div>}
      {loading && <div>Ładowanie…</div>}
      {!hasMore && <div style={{ color: "gray" }}>To już wszystko ✅</div>}

      {/* sentinel */}
      <div ref={sentinelRef} style={{ height: 1 }} />
    </div>
  );
}
