import axios from 'axios';

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true
});

export default api;
