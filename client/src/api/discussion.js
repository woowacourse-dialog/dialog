import api from './axios';

/**
 * 최신순 게시글 목록을 불러온다.
 * @param {Object} params
 * @param {Array<string>} [params.categories] - 카테고리 필터
 * @param {Array<string>} [params.statuses] - 상태 필터
 * @param {string|null} params.cursor - 커서(처음엔 null)
 * @param {number} params.size - 페이지 크기
 * @returns {Promise<{content: Array, nextCursor: string|null, hasNext: boolean}>}
 */
export async function fetchDiscussions({ categories, statuses, cursor = null, size = 10 } = {}) {
  const params = {
    cursor,
    size,
  };

  if (categories && categories.length > 0) {
    params.categories = categories.join(',');
  }
  if (statuses && statuses.length > 0) {
    params.statuses = statuses.join(',');
  }

  const res = await api.get('/discussions', { params });
  return {
    content: res.data.data.content,
    nextCursor: res.data.data.nextCursor,
    hasNext: res.data.data.hasNext,
    size: res.data.data.size
  };
}

export async function createDiscussion({ title, content, startDateTime, endDateTime, participantCount, location, track, summary}) {
  const res = await api.post('/discussions', {
    title,
    content,
    startAt: startDateTime,
    endAt: endDateTime,
    maxParticipantCount: participantCount,
    place: location,
    category: track,
    summary
  });
  return res.data;
}

export async function findDiscussionById(id) {
  const res = await api.get(`/discussions/${id}`);
  return res.data;
}

export async function participateDiscussion(id) {
  const res = await api.post(`/discussions/${id}/participants`);
  return res.data;
}

export async function updateDiscussion(id, { title, content, startDateTime, endDateTime, participantCount, location, track, summary}) {
  const res = await api.patch(`/discussions/${id}`, {
    title,
    content,
    startAt: startDateTime,
    endAt: endDateTime,
    place: location,
    maxParticipantCount: participantCount,
    category: track,
    summary
  });
  return res.data;
}

export async function deleteDiscussion(id) {
  const res = await api.delete(`/discussions/${id}`);
  return res.data;
}

/**
 * 검색된 게시글 목록을 불러온다.
 * @param {Object} params
 * @param {number} params.searchBy - 0: 제목+내용, 1: 작성자
 * @param {string} params.query - 검색어
 * @param {Array<string>} [params.categories] - 카테고리 필터
 * @param {Array<string>} [params.statuses] - 상태 필터
 * @param {string|null} params.cursor - 커서(처음엔 null)
 * @param {number} params.size - 페이지 크기
 * @returns {Promise<{content: Array, nextCursor: string|null, hasNext: boolean}>}
 */
export async function fetchSearchDiscussions({ searchBy, query, categories, statuses, cursor = null, size = 10 }) {
  const params = {
    searchBy,
    query,
    cursor,
    size,
  };

  if (categories && categories.length > 0) {
    params.categories = categories.join(',');
  }
  if (statuses && statuses.length > 0) {
    params.statuses = statuses.join(',');
  }

  const res = await api.get('/discussions/search', { params });
  return {
    content: res.data.data.content,
    nextCursor: res.data.data.nextCursor,
    hasNext: res.data.data.hasNext,
    size: res.data.data.size,
  };
}

/**
 * 내가 개설한 토론 목록을 불러온다.
 * @param {Object} params
 * @param {string|null} params.cursor - 커서(처음엔 null)
 * @param {number} params.size - 페이지 크기
 * @returns {Promise<{content: Array, nextCursor: string|null, hasNext: boolean}>}
 */
export async function fetchMyDiscussions({ cursor = null, size = 10} = {}) {
  const res = await api.get('/discussions/me', {
    params: {
      cursor,
      size
    }
  });
  return {
    content: res.data.data.content,
    nextCursor: res.data.data.nextCursor,
    hasNext: res.data.data.hasNext,
    size: res.data.data.size
  };
}

/**
 * 내가 스크랩한 토론 목록을 불러온다.
 * @param {Object} params
 * @param {number|null} params.lastCursorId - 마지막으로 받은 id(처음엔 null)
 * @param {number} params.size - 페이지 크기
 * @returns {Promise<{content: Array, nextCursorId: number|null, hasNext: boolean}>}
 */
export async function fetchScrapDiscussions({ lastCursorId, size = 10 } = {}) {
  const params = { size };
  if (lastCursorId !== undefined && lastCursorId !== null) {
    params.lastCursorId = lastCursorId;
  }
  const res = await api.get('/scraps/me', { params });
  return {
    content: res.data.data.content,
    nextCursorId: res.data.data.nextCursorId,
    hasNext: res.data.data.hasNext,
    size: res.data.data.size
  };
}

// 댓글 관련 API 함수들

/**
 * 토론의 댓글 목록을 불러온다.
 * @param {number} discussionId - 토론 ID
 * @returns {Promise<Array>} 댓글 목록 (계층 구조)
 */
export async function getComments(discussionId) {
  const res = await api.get(`/discussions/${discussionId}/comments`);
  return res.data.data.discussionComments;
}

/**
 * 댓글을 작성한다.
 * @param {Object} params
 * @param {string} params.content - 댓글 내용
 * @param {number} params.discussionId - 토론 ID
 * @param {number|null} params.parentDiscussionCommentId - 부모 댓글 ID (대댓글인 경우)
 * @returns {Promise<Object>} 생성된 댓글 정보
 */
export async function createComment({ content, discussionId, parentDiscussionCommentId = null }) {
  const res = await api.post('/discussions/comments', {
    content,
    discussionId,
    parentDiscussionCommentId
  });
  return res.data;
}

/**
 * 댓글을 수정한다.
 * @param {number} commentId - 댓글 ID
 * @param {Object} params
 * @param {string} params.content - 수정할 내용
 * @returns {Promise<Object>} 수정 결과
 */
export async function updateComment(commentId, { content }) {
  const res = await api.patch(`/discussions/comments/${commentId}`, {
    content
  });
  return res.data;
}

/**
 * 댓글을 삭제한다.
 * @param {number} commentId - 댓글 ID
 * @returns {Promise<Object>} 삭제 결과
 */
export async function deleteComment(commentId) {
  const res = await api.delete(`/discussions/comments/${commentId}`);
  return res.data;
}
