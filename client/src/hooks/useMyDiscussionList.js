import { useState, useRef, useCallback, useEffect } from 'react';
import { fetchMyDiscussions } from '../api/discussion';

/**
 * @param {Object} options
 * @param {number} [options.pageSize=10]
 */
export default function useMyDiscussionList({ pageSize = 10 } = {}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const hasFetched = useRef(false);
  const loaderRef = useRef(null);

  // 최초 데이터 로드
  useEffect(() => {
    hasFetched.current = false;
    setItems([]);
    setCursor(null);
    setHasMore(true);
    setError(null);
    setLoading(true);
    async function load() {
      try {
        const result = await fetchMyDiscussions({ cursor: null, size: pageSize });
        setItems(result.content);
        setCursor(result.nextCursor);
        setHasMore(result.hasNext);
      } catch (e) {
        setError('목록을 불러오지 못했습니다.');
        setHasMore(false);
      } finally {
        setLoading(false);
        hasFetched.current = true;
      }
    }
    load();
  }, [pageSize]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loading || isFetchingMore || error) return;
    if (items.length < pageSize) return;
    setIsFetchingMore(true);
    try {
      const result = await fetchMyDiscussions({ cursor, size: pageSize });
      setItems(prev => [...prev, ...result.content]);
      setCursor(result.nextCursor);
      setHasMore(result.hasNext);
    } catch (e) {
      setError('추가 목록을 불러오지 못했습니다.');
      setHasMore(false);
    } finally {
      setIsFetchingMore(false);
    }
  }, [cursor, hasMore, loading, isFetchingMore, pageSize, error, items.length]);

  useEffect(() => {
    if (!loaderRef.current || !hasMore || loading || isFetchingMore || error) return;
    // ... observer attach ...
  }, [loadMore, hasMore, loading, isFetchingMore, error, items.length]);

  const reset = useCallback(() => {
    hasFetched.current = false;
    setItems([]);
    setCursor(null);
    setHasMore(true);
    setError(null);
    setLoading(true);
    async function load() {
      try {
        const result = await fetchMyDiscussions({ cursor: null, size: pageSize });
        setItems(result.content);
        setCursor(result.nextCursor);
        setHasMore(result.hasNext);
      } catch (e) {
        setError('목록을 불러오지 못했습니다.');
        setHasMore(false);
      } finally {
        setLoading(false);
        hasFetched.current = true;
      }
    }
    load();
  }, [pageSize]);

  return {
    items,
    loading,
    error,
    hasMore,
    isFetchingMore,
    loadMore,
    reset,
  };
} 