import { useState, useRef, useCallback, useEffect } from 'react';
import { fetchDiscussions, fetchSearchDiscussions } from '../api/discussion';

/**
 * @param {Object} options
 * @param {Object|null} options.searchParams - { searchType, query, categories, statuses } or null
 * @param {number} [options.pageSize=10]
 */
export default function useDiscussionList({ searchParams = null, pageSize = 10 } = {}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const hasFetched = useRef(false);

  // 최초 데이터 로드 or 검색 파라미터 변경 시
  useEffect(() => {
    hasFetched.current = false;
    setItems([]);
    setCursor(null);
    setHasMore(true);
    setError(null);
    setLoading(true);
    async function load() {
      try {
        let result;
        const commonParams = {
          categories: searchParams?.categories,
          statuses: searchParams?.statuses,
          cursor: null,
          size: pageSize,
        };

        // 검색어(query)의 존재 여부로 API를 분기
        if (searchParams && typeof searchParams.query === 'string') {
          result = await fetchSearchDiscussions({
            ...commonParams,
            searchBy: searchParams.searchType,
            query: searchParams.query,
          });
        } else {
          result = await fetchDiscussions(commonParams);
        }
        setItems(result.content);
        setCursor(result.nextCursor);
        setHasMore(result.hasNext);
      } catch (e) {
        setError('목록을 불러오지 못했습니다.');
      } finally {
        setLoading(false);
        hasFetched.current = true;
      }
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    searchParams?.searchType,
    searchParams?.query,
    JSON.stringify(searchParams?.categories),
    JSON.stringify(searchParams?.statuses),
    pageSize
  ]);

  // 추가 데이터 로드
  const loadMore = useCallback(async () => {
    if (!hasMore || isFetchingMore || loading) return;
    setIsFetchingMore(true);
    try {
      let result;
      const commonParams = {
        categories: searchParams?.categories,
        statuses: searchParams?.statuses,
        cursor,
        size: pageSize,
      };

      // 검색어(query)의 존재 여부로 API를 분기
      if (searchParams && typeof searchParams.query === 'string') {
        result = await fetchSearchDiscussions({
          ...commonParams,
          searchBy: searchParams.searchType,
          query: searchParams.query,
        });
      } else {
        result = await fetchDiscussions(commonParams);
      }
      setItems((prev) => [...prev, ...result.content]);
      setCursor(result.nextCursor);
      setHasMore(result.hasNext);
    } catch (e) {
      setError('목록을 추가로 불러오지 못했습니다.');
      setHasMore(false);
    } finally {
      setIsFetchingMore(false);
    }
  }, [hasMore, isFetchingMore, loading, searchParams, cursor, pageSize]);

  // 검색/목록 리셋
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
  };
} 