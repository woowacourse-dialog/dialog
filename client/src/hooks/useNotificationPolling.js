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
    const activePollController = useRef(null);
    const abortControllerRef = useRef(null);

    // Initial load
    useEffect(() => {
        if (isLoggedIn) {
            loadInitialNotifications();
        } else {
            // Reset state on logout
            setNotifications([]);
            setUnreadCount(0);
            setLastNotificationId(null);
            setPage(0);
            setHasMore(true);
        }
    }, [isLoggedIn]);

    const loadInitialNotifications = async () => {
        try {
            setIsLoading(true);
            const response = await getNotificationPage(0, 10);

            if (!response || !response.data) {
                console.warn('Invalid response from getNotificationPage:', response);
                return;
            }

            const data = response.data;
            setNotifications(data.notifications || []);
            setUnreadCount(data.unreadCount || 0);
            setPage(1);

            const currentPage = data.currentPage || 0;
            const totalPages = data.totalPages || 0;
            setHasMore(currentPage < totalPages - 1);

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
    const poll = useCallback(async (controller) => {
        if (!isLoggedIn || isPollingRef.current || controller.cancelled) return;

        isPollingRef.current = true;

        // Create new AbortController for this polling request
        const abortController = new AbortController();
        abortControllerRef.current = abortController;

        try {
            const response = await getPollingNotifications(
                lastNotificationId,
                sessionIdRef.current,
                abortController.signal
            );

            if (controller.cancelled) return;

            if (response && response.data) {
                const data = response.data;

                if (data.unreadCount !== undefined) {
                    setUnreadCount(data.unreadCount);
                }

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
            // Ignore abort errors - they're expected when unmounting
            if (error.name === 'AbortError' || error.name === 'CanceledError') {
                console.log('Polling request cancelled');
                return;
            }

            console.error('Notification polling error:', error);
            if (!controller.cancelled) {
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
        } finally {
            isPollingRef.current = false;
            if (isLoggedIn && !controller.cancelled) {
                poll(controller);
            }
        }
    }, [isLoggedIn, lastNotificationId]);

    // Polling effect: only start/stop on login status change
    // Note: 'poll' is intentionally excluded from dependencies to prevent
    // infinite loop when lastNotificationId updates
    useEffect(() => {
        if (isLoggedIn) {
            // Start polling with a small delay to avoid conflicts with StrictMode double mounting
            const timeoutId = setTimeout(() => {
                const controller = { cancelled: false };
                activePollController.current = controller;
                poll(controller);
            }, 100);

            return () => {
                // Clear the timeout if component unmounts before polling starts
                clearTimeout(timeoutId);
                // Cancel the polling logic
                if (activePollController.current) {
                    activePollController.current.cancelled = true;
                }
                // Abort the actual HTTP request
                if (abortControllerRef.current) {
                    abortControllerRef.current.abort();
                }
            };
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoggedIn]);

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
