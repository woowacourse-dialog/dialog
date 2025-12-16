import { useState, useEffect, useCallback, useRef } from 'react';
import { getPollingNotifications, updateNotificationAsRead, updateAllNotificationAsRead, getNotificationPage } from '../api/notification';

const useNotificationPolling = (isLoggedIn) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [lastNotificationId, setLastNotificationId] = useState(null);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [isLoading, setIsLoading] = useState(false);

    const isPollingRef = useRef(false);
    const sessionIdRef = useRef(crypto.randomUUID());

    // Initial load
    useEffect(() => {
        if (isLoggedIn) {
            loadInitialNotifications();
        }
    }, [isLoggedIn]);

    const loadInitialNotifications = async () => {
        try {
            setIsLoading(true);
            const response = await getNotificationPage(0, 10);

            // Guard clause: check if response and response.data exist
            if (!response || !response.data) {
                console.warn('Invalid response from getNotificationPage:', response);
                return;
            }

            const data = response.data;
            setNotifications(data.notifications || []); // Default to empty array
            setUnreadCount(data.unreadCount || 0);
            setPage(1);

            // Safe access to pagination info
            const currentPage = data.currentPage || 0;
            const totalPages = data.totalPages || 0;
            setHasMore(currentPage < totalPages - 1);

            // Update lastNotificationId for polling
            if (data.notifications && data.notifications.length > 0) {
                const newestId = Math.max(...data.notifications.map(n => n.id));
                setLastNotificationId(newestId);
            }
        } catch (error) {
            console.error('Failed to load initial notifications:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const loadMore = async () => {
        if (isLoading || !hasMore) return;

        try {
            setIsLoading(true);
            const response = await getNotificationPage(page, 10);

            if (!response || !response.data) return;

            const data = response.data;
            const newNotifications = data.notifications || [];

            setNotifications(prev => {
                const existingIds = new Set(prev.map(n => n.id));
                const uniqueNew = newNotifications.filter(n => !existingIds.has(n.id));
                return [...prev, ...uniqueNew];
            });

            setPage(prev => prev + 1);

            const currentPage = data.currentPage || 0;
            const totalPages = data.totalPages || 0;
            setHasMore(currentPage < totalPages - 1);
        } catch (error) {
            console.error('Failed to load more notifications:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Polling function
    const poll = useCallback(async () => {
        if (!isLoggedIn || isPollingRef.current) return;

        isPollingRef.current = true;
        try {
            const response = await getPollingNotifications(lastNotificationId, sessionIdRef.current);

            if (response && response.data) {
                const data = response.data;

                // 항상 unreadCount 업데이트
                if (data.unreadCount !== undefined) {
                    setUnreadCount(data.unreadCount);
                }

                // 새 알림이 있을 때만 notifications 업데이트
                if (data.status === 'NEW_NOTIFICATION' && data.notifications && data.notifications.length > 0) {
                    setNotifications(prev => {
                        const existingIds = new Set(prev.map(n => n.id));
                        const uniqueNew = data.notifications.filter(n => !existingIds.has(n.id));
                        return [...uniqueNew, ...prev];
                    });

                    const newestId = Math.max(...data.notifications.map(n => n.id));
                    setLastNotificationId(newestId);
                }
            }
        } catch (error) {
            console.error('Notification polling error:', error);
            await new Promise(resolve => setTimeout(resolve, 3000));
        } finally {
            isPollingRef.current = false;
            if (isLoggedIn) {
                poll();
            }
        }
    }, [isLoggedIn, lastNotificationId]);

    useEffect(() => {
        if (isLoggedIn) {
            poll();
        }
        return () => { };
    }, [isLoggedIn, poll]);

    const markAsRead = async (id) => {
        try {
            await updateNotificationAsRead(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await updateAllNotificationAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Failed to mark all notifications as read:', error);
        }
    };

    return { notifications, unreadCount, markAsRead, markAllAsRead, loadMore, hasMore, isLoading };
};

export default useNotificationPolling;
