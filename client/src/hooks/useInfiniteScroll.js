import { useRef, useEffect } from 'react';

export default function useInfiniteScroll({ loadMore, hasMore, loading, isFetchingMore }) {
  const loaderRef = useRef(null);
  const loadMoreRef = useRef(loadMore);

  useEffect(() => {
    loadMoreRef.current = loadMore;
  });

  useEffect(() => {
    if (!loaderRef.current || !hasMore) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) loadMoreRef.current();
    }, { threshold: 1 });
    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [hasMore]);

  return loaderRef;
}
