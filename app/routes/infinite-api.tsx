// UsersInfinite.tsx
import keycloak from "~/easy-keycloak";

export default function UsersInfinite() {
  const enabled = keycloak.authenticated; // lub from useAuth(): ready && isAuthenticated

  const fetchPage = useMemo(() => {
    return async (page: number, signal: AbortSignal) => {
      const limit = 10;
      const data = await apiFetch<User[]>(
        `/api/users?page=${page}&limit=${limit}`,
        { signal }
      );
      const nextPage = data.length < limit ? null : page + 1;
      return { items: data, nextPage };
    };
  }, []);

  const { items, loadMore, loading, hasMore, error } = useInfiniteList<User>({
    fetchPage,
    startPage: 1,
    enabled, // ⬅️ tu zamiast true
  });

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!enabled || !sentinelRef.current) return; // ⬅️ nie obserwuj dopóki nie zalogowany

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) loadMore();
    });

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [enabled, loadMore]);

  // ...
}
