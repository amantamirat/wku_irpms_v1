import { useState, useEffect, useCallback } from 'react';
import { ApiClient, BASE_URL } from "@/api/ApiClient";
import { io } from 'socket.io-client';
import { useAuth } from '@/contexts/auth-context';

export const useNotifications = () => {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotifications = useCallback(async () => {
        setLoading(true);
        try {
            const notifications = await ApiClient.get('/notifications');
            setNotifications(notifications);

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


    const { getApplicant } = useAuth();
    const SOCKET_URL = BASE_URL?.replace('/api', '');
    useEffect(() => {
        const applicantData = getApplicant();
        // 1. Determine the ID: if getApplicant is an object, use _id, otherwise use it as a string
        const applicantId = typeof applicantData === 'object' && applicantData !== null
            ? (applicantData as any)._id
            : applicantData;

        // 2. Only connect if we actually have an ID
        if (!applicantId) return;

        const socket = io(SOCKET_URL, {
            query: { applicantId }
        });

        const notificationSound = new Audio('/sounds/beep.mp3');
        socket.on('new_notification', (newNotif) => {
            setNotifications(prev => [newNotif, ...prev]);
            setUnreadCount(prev => prev + 1);

            notificationSound.play().catch(err => {
                // Browsers often block audio until the user clicks something on the page
                console.error("Audio playback failed:", err);
            });
        });

        return () => {
            socket.disconnect();
        };
        // Ensure the dependency matches the variable used to trigger the connection
    }, [getApplicant]);

    return {
        notifications,
        loading,
        unreadCount,
        markAsRead,
        markAllRead,
        refresh: fetchNotifications
    };
};