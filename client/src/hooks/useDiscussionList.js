import { useCallback } from 'react';
import { fetchDiscussions, fetchSearchDiscussions } from '../api/discussion';
import usePaginatedList from './usePaginatedList';

export default function useDiscussionList({ searchParams = null, pageSize = 10 } = {}) {
  const fetchFn = useCallback(async (cursor) => {
    const commonParams = {
      categories: searchParams?.categories,
      statuses: searchParams?.statuses,
      discussionTypes: searchParams?.discussionTypes,
      cursor,
      size: pageSize,
    };

    let result;
    if (searchParams && typeof searchParams.query === 'string') {
      result = await fetchSearchDiscussions({
        ...commonParams,
        searchBy: searchParams.searchType,
        query: searchParams.query,
      });
    } else {
      result = await fetchDiscussions(commonParams);
    }

    return {
      items: result.content,
      nextCursor: result.nextCursor,
      hasNext: result.hasNext,
    };
  }, [searchParams, pageSize]);

  return usePaginatedList({
    fetchFn,
    deps: [
      searchParams?.searchType,
      searchParams?.query,
      JSON.stringify(searchParams?.categories),
      JSON.stringify(searchParams?.statuses),
      JSON.stringify(searchParams?.discussionTypes),
      pageSize,
    ],
    deduplicate: true,
  });
}
