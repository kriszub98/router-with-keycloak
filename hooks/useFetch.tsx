// useFetch.ts
import { useState, useEffect } from "react";

type UseFetchState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
};

type UseFetchConfig = {
  skip?: boolean;
  deps?: any[];
};

export function useFetch<T = unknown>(
  url: string,
  options?: RequestInit,
  config: UseFetchConfig = {}
) {
  const { skip = false, deps = [] } = config;

  const [state, setState] = useState<UseFetchState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  useEffect(() => {
    if (skip || !url) return;

    const controller = new AbortController();

    const fetchData = async () => {
      setState((s) => ({ ...s, loading: true, error: null }));

      try {
        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Błąd: ${response.status} ${response.statusText}`);
        }

        const json = (await response.json()) as T;
        setState({ data: json, loading: false, error: null });
      } catch (err) {
        if (controller.signal.aborted) return;
        setState({ data: null, loading: false, error: (err as Error).message });
      }
    };

    fetchData();
    return () => controller.abort();
  }, [url, skip, ...deps]);

  return state;
}
