import { useEffect, useRef, useMemo } from "react";
import { useInfiniteList } from "hooks/useInfiniteList";

type User = { id: number; name: string };

export default function UsersInfinite() {
  // Jeśli masz token – pobieraj z nagłówkiem. Tu: fake API.
  const fetchPage = useMemo(() => {
    return async (page: number, signal: AbortSignal) => {
      const limit = 10;
      const res = await fetch(
        `https://jsonplaceholder.typicode.com/users?_page=${page}&_limit=${limit}`,
        { signal }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const items = (await res.json()) as User[];
      // jsonplaceholder nie daje total/next – symulujemy koniec po 10 stronach
      const nextPage = items.length < limit ? null : page + 1;
      return { items, nextPage };
    };
  }, []);

  const { items, loading, error, hasMore, loadMore } = useInfiniteList<User>({
    fetchPage,
    startPage: 1,
    enabled: true,
  });

  // Sentinel
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) loadMore();
    });
    io.observe(node);
    return () => io.disconnect();
  }, [loadMore]);

  return (
    <div className="p-4">
      <h1 className="mb-2">Users (infinite)</h1>
      <ul className="space-y-2">
        {items.map((u) => (
          <li key={u.id} className="border rounded p-2">
            {u.id}. {u.name}
          </li>
        ))}
      </ul>

      {error && <div className="text-red-600 mt-2">Błąd: {error}</div>}
      <div ref={sentinelRef} style={{ height: 1 }} />
      {loading && <div className="mt-2">Ładowanie…</div>}
      {!hasMore && <div className="mt-2 text-gray-500">To już wszystko.</div>}
    </div>
  );
}
