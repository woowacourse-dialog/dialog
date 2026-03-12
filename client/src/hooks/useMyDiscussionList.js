import { useCallback } from 'react';
import { fetchMyDiscussions } from '../api/discussion';
import usePaginatedList from './usePaginatedList';

export default function useMyDiscussionList({ pageSize = 10 } = {}) {
  const fetchFn = useCallback(async (cursor) => {
    const result = await fetchMyDiscussions({ cursor, size: pageSize });
    return {
      items: result.content,
      nextCursor: result.nextCursor,
      hasNext: result.hasNext,
    };
  }, [pageSize]);

  return usePaginatedList({
    fetchFn,
    deps: [fetchFn],
  });
}
