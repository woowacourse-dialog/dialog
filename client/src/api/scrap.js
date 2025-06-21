import api from "./axios";

export async function scrapDiscussion(discussionsId) {
  const res = await api.post(`/discussions/${discussionsId}/scraps`);
  return res.data;
}

export async function deleteScrapDiscussion(discussionsId) {
  const res = await api.delete(`/discussions/${discussionsId}/scraps`);
  return res.data;
}