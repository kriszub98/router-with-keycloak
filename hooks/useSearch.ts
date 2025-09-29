import { useEffect, useMemo, useRef, useState } from "react";
import { apiFetch } from "api/apiClient";

type UseSearchOptions<T> = {
  /** Endpoint do pobrania pełnej listy przy starcie */
  initialUrl: string;
  /** Funkcja budująca URL do wyszukiwania (server-side filtering) */
  searchUrl: (query: string) => string;
  /** Minimalna liczba znaków aby zacząć filtrować (domyślnie 3) */
  minChars?: number;
  /** Debounce dla wyszukiwania (ms) — domyślnie 300 */
  debounceMs?: number;
  /** Możesz wyłączyć hook do czasu aż auth będzie gotowy (np. ready && isAuthenticated) */
  enabled?: boolean;
  /** Opcjonalna transformacja odpowiedzi (np. wyjęcie pola .items) */
  mapResponse?: (raw: unknown) => T[];
};

type UseSearchState<T> = {
  query: string;
  setQuery: (q: string) => void;
  results: T[];
  loading: boolean;
  error: string | null;
  /** Czy aktualnie pokazujemy wynik filtrowany (true) czy pełną listę (false) */
  isFiltered: boolean;
  /** Ręczne odświeżenie pełnej listy */
  refetchInitial: () => void;
};

export function useSearch<T = unknown>({
  initialUrl,
  searchUrl,
  minChars = 3,
  debounceMs = 300,
  enabled = true,
  mapResponse,
}: UseSearchOptions<T>): UseSearchState<T> {
  const [query, setQuery] = useState("");
  const [fullData, setFullData] = useState<T[]>([]);
  const [results, setResults] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialTick, setInitialTick] = useState(0); // do ręcznego refetchu pełnej listy

  const searchAbortRef = useRef<AbortController | null>(null);
  const initialAbortRef = useRef<AbortController | null>(null);

  const isFiltered = query.length >= minChars;

  const extract = useMemo(
    () => (mapResponse ? mapResponse : (raw: unknown) => raw as T[]),
    [mapResponse]
  );

  // 1) Pobierz pełną listę przy starcie / gdy enabled zmieni się z false->true / przy refetchu
  useEffect(() => {
    if (!enabled) return;
    initialAbortRef.current?.abort();
    const controller = new AbortController();
    initialAbortRef.current = controller;

    setLoading(true);
    setError(null);

    apiFetch<unknown>(initialUrl, { signal: controller.signal })
      .then((raw) => {
        const data = extract(raw);
        setFullData(data);
        // jeśli nie ma aktywnego filtra, pokaż pełną listę
        if (!isFiltered) setResults(data);
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError((e as Error).message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, initialUrl, initialTick]); // UWAŻNIE: brak query tutaj

  // 2) Reakcja na wpisywanie: < minChars → pokaż fullData; >= minChars → debounce + fetch(search)
  useEffect(() => {
    if (!enabled) return;

    // < minChars → anuluj ewentualne zapytanie i pokaż pełną listę (bez refetchu)
    if (query.length < minChars) {
      searchAbortRef.current?.abort();
      setError(null);
      setResults(fullData);
      return;
    }

    // >= minChars → debounce + fetch
    const controller = new AbortController();
    searchAbortRef.current = controller;
    const t = window.setTimeout(() => {
      setLoading(true);
      setError(null);

      apiFetch<unknown>(searchUrl(query), { signal: controller.signal })
        .then((raw) => setResults(extract(raw)))
        .catch((e) => {
          if (!controller.signal.aborted) setError((e as Error).message);
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, debounceMs);

    return () => {
      window.clearTimeout(t);
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, enabled, searchUrl, debounceMs, minChars, extract, fullData]);

  const refetchInitial = () => setInitialTick((x) => x + 1);

  return {
    query,
    setQuery,
    results,
    loading,
    error,
    isFiltered,
    refetchInitial,
  };
}
