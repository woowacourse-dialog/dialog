import api from './axios';
import axios from 'axios';

// Create a separate axios instance for long-polling with extended timeout
const pollingApi = axios.create({
    baseURL: `${import.meta.env.VITE_API_URL}/api`,
    timeout: 45000, // 45 seconds timeout for long polling (server timeout is 30s)
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true
});

export const getNotificationPage = async (page = 0, size = 10) => {
    const response = await api.get('/notifications/me', {
        params: { page, size }
    });
    return response.data;
};

export const getPollingNotifications = async (lastNotificationId, sessionId, signal) => {
    const params = {
        ...(lastNotificationId && { lastNotificationId }),
        sessionId
    };
    const response = await pollingApi.get('/notifications/polling', {
        params,
        signal // AbortSignal to cancel request on unmount
    });
    return response.data;
};

export const updateNotificationAsRead = async (notificationId) => {
    const response = await api.patch(`/notifications/${notificationId}`);
    return response.data;
};

export const updateAllNotificationAsRead = async () => {
    const response = await api.patch('/notifications/all');
    return response.data;
};
