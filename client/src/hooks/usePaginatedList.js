import { useState, useRef, useCallback, useEffect } from 'react';

export default function usePaginatedList({ fetchFn, deps = [], deduplicate = false } = {}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const hasFetched = useRef(false);

  useEffect(() => {
    hasFetched.current = false;
    setItems([]);
    setCursor(null);
    setHasMore(true);
    setError(null);
    setLoading(true);

    async function load() {
      try {
        const result = await fetchFn(null);
        setItems(result.items);
        setCursor(result.nextCursor);
        setHasMore(result.hasNext);
      } catch {
        setError('목록을 불러오지 못했습니다.');
        setHasMore(false);
      } finally {
        setLoading(false);
        hasFetched.current = true;
      }
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const loadMore = useCallback(async () => {
    if (!hasMore || isFetchingMore || loading || !cursor) return;
    setIsFetchingMore(true);
    try {
      const result = await fetchFn(cursor);
      setItems((prev) => {
        if (deduplicate) {
          const existingIds = new Set(prev.map(item => item.id));
          const newItems = result.items.filter(item => !existingIds.has(item.id));
          return [...prev, ...newItems];
        }
        return [...prev, ...result.items];
      });
      setCursor(result.nextCursor);
      setHasMore(result.hasNext);
    } catch {
      setError('목록을 추가로 불러오지 못했습니다.');
      setHasMore(false);
    } finally {
      setIsFetchingMore(false);
    }
  }, [hasMore, isFetchingMore, loading, cursor, fetchFn, deduplicate]);

  const reset = useCallback(() => {
    setItems([]);
    setCursor(null);
    setHasMore(true);
    setError(null);
    setLoading(false);
    hasFetched.current = false;
  }, []);

  return {
    items,
    loading,
    error,
    hasMore,
    isFetchingMore,
    loadMore,
    reset,
    hasFetched: hasFetched.current,
  };
}
