import api from './axios';


export const getNotificationPage = async (page = 0, size = 10) => {
    const response = await api.get('/notifications/me', {
        params: { page, size }
    });
    return response.data;
};

export const getPollingNotifications = async (lastNotificationId, sessionId) => {
    const params = {
        ...(lastNotificationId && { lastNotificationId }),
        sessionId
    };
    const response = await api.get('/notifications/polling', {
        params,
        timeout: 45000 // 45 seconds timeout to allow long polling (server timeout is 30s)
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
