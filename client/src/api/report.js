import api from './axios';

export async function reportDiscussion(discussionId, reason) {
  const res = await api.post(`/discussions/${discussionId}/reports`, { reason });
  return res.data;
}

export async function reportComment(discussionId, commentId, reason) {
  const res = await api.post(
    `/discussions/${discussionId}/comments/${commentId}/reports`,
    { reason }
  );
  return res.data;
}
