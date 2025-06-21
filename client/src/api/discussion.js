import api from './axios';

/**
 * 최신순 게시글 목록을 불러온다.
 * @param {Object} params
 * @param {string|null} params.cursor - 커서(처음엔 null)
 * @param {number} params.size - 페이지 크기
 * @returns {Promise<{content: Array, nextCursor: string|null, hasNext: boolean}>}
 */
export async function fetchDiscussions({ cursor = null, size = 10} = {}) {
    const res = await api.get('/discussions', {
    params: {
      cursor,
      size
    }
  }
);
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
