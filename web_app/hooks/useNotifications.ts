import { useState, useEffect, useCallback } from 'react';
import { ApiClient } from "@/api/ApiClient";

export const useNotifications = () => {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotifications = useCallback(async () => {
        setLoading(true);
        try {
            const notifications = await ApiClient.get('/notifications');
            //const data = notifications;
            setNotifications(notifications);
            //console.log("notifications", notifications);
            // Calculate unread count locally
            const unread = notifications.filter((n: any) => !n.isRead).length;
            //console.log("unread", unread);
            setUnreadCount(unread);
        } catch (error) {
            console.error("Error fetching notifications", error);
        } finally {
            setLoading(false);
        }
    }, []);

    const markAsRead = async (id: string) => {
        try {
            await ApiClient.patch(`/notifications/${id}/read`);
            // Update local state to avoid a full re-fetch
            setNotifications(prev =>
                prev.map(n => n._id === id ? { ...n, isRead: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error("Error marking as read", error);
        }
    };

    const markAllRead = async () => {
        try {
            await ApiClient.post('/notifications/read-all', {});
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error("Error marking all read", error);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    return {
        notifications,
        loading,
        unreadCount,
        markAsRead,
        markAllRead,
        refresh: fetchNotifications
    };
};