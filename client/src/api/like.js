import api from "./axios";


export async function likeDiscussion(discussionsId) {
  const res = await api.post(`/discussions/${discussionsId}/likes`);
  return res.data;
}

export async function deleteLikeDiscussion(discussionsId) {
  const res = await api.delete(`/discussions/${discussionsId}/likes`);
  return res.data;
}

export async function getLikeStatus(discussionsId) {
  const res = await api.get(`/discussions/${discussionsId}/likes/status`);
  return res.data;
}
