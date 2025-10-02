import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch } from "~/api/apiClient";

// Dostosuj do swojego API, ewentualnie użyj mapResponse (patrz opcje)
export type PageResponse<T> = {
  items: T[];
  page: number; // numer strony z API (np. 0-based)
  totalPages: number; // ile jest wszystkich stron
};

type Options<Q, T> = {
  /** „Zastosowane” query – zmienia się TYLKO po kliknięciu w przycisk */
  query: Q;
  /** Buduje URL dla danej strony */
  buildUrl: (query: Q, page: number) => string;
  /** Czy w ogóle uruchamiać hook (np. ready && isAuthenticated) */
  enabled?: boolean;
  /** Startowa strona (domyślnie 0) */
  initialPage?: number;
  /** Mapowanie odpowiedzi z API do standaryzowanego PageResponse */
  mapResponse?: (raw: unknown) => PageResponse<T>;
};

export function useInfiniteSearch<Q, T>({
  query,
  buildUrl,
  enabled = true,
  initialPage = 0,
  mapResponse,
}: Options<Q, T>) {
  const [items, setItems] = useState<T[]>([]);
  const [page, setPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const hasMore = totalPages === null ? true : page + 1 < totalPages;

  const fetchPage = useCallback(
    async (p: number) => {
      setLoading(true);
      setError(null);

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const raw = await apiFetch<unknown>(buildUrl(query, p), {
          signal: controller.signal,
        });

        const resp: PageResponse<T> = mapResponse
          ? mapResponse(raw)
          : (raw as PageResponse<T>); // jeżeli API już w tym formacie

        // walidacja minimalna
        if (
          !resp ||
          !Array.isArray(resp.items) ||
          typeof resp.page !== "number" ||
          typeof resp.totalPages !== "number"
        ) {
          throw new Error("Nieprawidłowy format odpowiedzi API");
        }

        setItems((prev) =>
          p === initialPage ? resp.items : [...prev, ...resp.items]
        );
        setPage(resp.page);
        setTotalPages(resp.totalPages);
      } catch (e) {
        if (!abortRef.current?.signal.aborted) {
          setError((e as Error).message);
        }
      } finally {
        if (!abortRef.current?.signal.aborted) {
          setLoading(false);
        }
      }
    },
    [buildUrl, query, mapResponse, initialPage]
  );

  // Reset i pierwszy fetch przy zmianie ZASTOSOWANEGO query
  useEffect(() => {
    if (!enabled) return;
    setItems([]);
    setPage(initialPage);
    setTotalPages(null);
    void fetchPage(initialPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, initialPage, fetchPage]);

  // API publiczne hooka
  const loadMore = useCallback(() => {
    if (loading || !enabled) return;
    if (!hasMore) return;
    void fetchPage(page + 1);
  }, [loading, enabled, hasMore, page, fetchPage]);

  // cleanup
  useEffect(() => () => abortRef.current?.abort(), []);

  return {
    items,
    loading,
    error,
    page,
    totalPages,
    hasMore,
    loadMore,
    refetchFirstPage: () => fetchPage(initialPage),
  };
}
