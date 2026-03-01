import api from './axios';

export const userApi = {
  
  signup: ({email, password, name, nickname}) => {
    return api.post('/users/signup', {email, password, name, nickname});
  },
  
  getTrack: () => {
    return api.get('/user/mine/track');
  },
};

export default userApi;

export async function fetchMyInfo() {
  const res = await api.get('/user/mine');
  return res.data.data;
}

export async function fetchMyProfileImage() {
  const res = await api.get('/user/mine/profile-image');
  return res.data.data;
}

export async function updateNotificationSetting(isNotificationEnable) {
  const res = await api.patch('/user/mine/notifications', {
    isNotificationEnable,
  });
  return res.data;
}

export async function updateProfileImage(file) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await api.patch('/user/mine/profile-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

export async function updateUserInfo({ nickname, track }) {
  const res = await api.patch('/user/mine', { nickname, track });
  return res.data;
}
