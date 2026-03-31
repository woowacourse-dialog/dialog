import api from "./axios";

export async function likeComment(commentId) {
  const res = await api.post(`/discussions/comments/${commentId}/likes`);
  return res.data;
}

export async function unlikeComment(commentId) {
  const res = await api.delete(`/discussions/comments/${commentId}/likes`);
  return res.data;
}
