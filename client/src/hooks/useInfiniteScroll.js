import { useRef, useEffect } from 'react';

export default function useInfiniteScroll({ loadMore, hasMore, loading, isFetchingMore }) {
  const loaderRef = useRef(null);

  useEffect(() => {
    if (!loaderRef.current || !hasMore || loading || isFetchingMore) return;
    const observer = new window.IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !loading && !isFetchingMore) {
        loadMore();
      }
    }, { threshold: 1 });
    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [loadMore, hasMore, loading, isFetchingMore]);

  return loaderRef;
}
