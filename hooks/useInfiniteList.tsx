import { useEffect, useRef, useState, useCallback } from "react";

type Page<T> = { items: T[]; nextPage?: number | null };

type InfiniteConfig<T> = {
  fetchPage: (page: number, signal: AbortSignal) => Promise<Page<T>>;
  startPage?: number; // domyślnie 1
  enabled?: boolean; // np. !token ? false : true
};

export function useInfiniteList<T>({
  fetchPage,
  startPage = 1,
  enabled = true,
}: InfiniteConfig<T>) {
  const [pages, setPages] = useState<Page<T>[]>([]);
  const [page, setPage] = useState(startPage);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const abortRef = useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    if (!enabled || loading || !hasMore) return;
    setLoading(true);
    setError(null);

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const data = await fetchPage(page, controller.signal);
      setPages((prev) => [...prev, data]);
      setHasMore(Boolean(data.nextPage));
      if (data.nextPage) setPage(data.nextPage);
    } catch (e) {
      if (!controller.signal.aborted) setError((e as Error).message);
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [enabled, hasMore, loading, page, fetchPage]);

  const items = pages.flatMap((p) => p.items);

  // do ręcznego “Load more”
  const loadMore = useCallback(() => {
    if (enabled && !loading && hasMore) void load();
  }, [enabled, loading, hasMore, load]);

  // reset gdy `enabled` zmienia się z false->true
  useEffect(() => {
    if (!enabled) return;
    setPages([]);
    setPage(startPage);
    setHasMore(true);
    setError(null);
  }, [enabled, startPage]);

  useEffect(() => () => abortRef.current?.abort(), []);

  return { items, loading, error, hasMore, loadMore };
}
