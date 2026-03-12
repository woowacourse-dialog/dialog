import { useSearchParams, useNavigate } from 'react-router-dom';
import { useCallback } from 'react';

export default function useFilterParams(basePath) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const categories = searchParams.get('categories')?.split(',').filter(Boolean) || [];
  const statuses = searchParams.get('statuses')?.split(',').filter(Boolean) || [];
  const discussionTypes = searchParams.get('discussionTypes')?.split(',').filter(Boolean) || [];
  const searchType = Number(searchParams.get('searchType')) || 0;
  const query = searchParams.get('query') || '';

  const handleCategoryChange = useCallback((newCategories) => {
    const newParams = new URLSearchParams(window.location.search);
    if (newCategories.length > 0) {
      newParams.set('categories', newCategories.join(','));
    } else {
      newParams.delete('categories');
    }
    navigate(`${basePath}?${newParams.toString()}`);
  }, [navigate, basePath]);

  const handleStatusChange = useCallback((newStatuses) => {
    const newParams = new URLSearchParams(window.location.search);
    if (newStatuses.length > 0) {
      newParams.set('statuses', newStatuses.join(','));
    } else {
      newParams.delete('statuses');
    }
    navigate(`${basePath}?${newParams.toString()}`);
  }, [navigate, basePath]);

  const handleDiscussionTypeChange = useCallback((newTypes) => {
    const newParams = new URLSearchParams(window.location.search);
    if (newTypes.length > 0) {
      newParams.set('discussionTypes', newTypes.join(','));
    } else {
      newParams.delete('discussionTypes');
    }
    navigate(`${basePath}?${newParams.toString()}`);
  }, [navigate, basePath]);

  return {
    categories,
    statuses,
    discussionTypes,
    searchType,
    query,
    searchParams,
    handleCategoryChange,
    handleStatusChange,
    handleDiscussionTypeChange,
  };
}
