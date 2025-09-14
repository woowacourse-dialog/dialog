import api from './axios';

export const userApi = {
  
  signup: ({email, password, name, nickname}) => {
    return api.post('/users/signup', {email, password, name, nickname});
  },
  
  getTrack: () => {
    return api.get('/users/mine/track');
  },
};

export default userApi;
