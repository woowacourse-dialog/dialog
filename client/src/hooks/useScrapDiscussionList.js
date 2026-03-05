import { useCallback } from 'react';
import { fetchScrapDiscussions } from '../api/discussion';
import usePaginatedList from './usePaginatedList';

export default function useScrapDiscussionList({ pageSize = 10 } = {}) {
  const fetchFn = useCallback(async (cursor) => {
    const result = await fetchScrapDiscussions({ lastCursorId: cursor, size: pageSize });
    return {
      items: result.content,
      nextCursor: result.nextCursorId,
      hasNext: result.hasNext,
    };
  }, [pageSize]);

  return usePaginatedList({
    fetchFn,
    deps: [fetchFn],
  });
} 