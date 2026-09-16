import { useState, useEffect, useCallback } from 'react';
import { ApiClient, BASE_URL } from "@/api/ApiClient";
import { io } from 'socket.io-client';
import { useAuth } from '@/contexts/auth-context';
import { extractId } from "@/utils/utils";

export enum NotificationType {
    INFO = 'info',
    SUCCESS = 'success',
    WARNING = 'warning',
    ERROR = 'error'
}

export interface NotificationDTO {
    recipient: string;
    sender?: string;
    title: string;
    message: string;
    type?: NotificationType;
    link?: string;
    expiresAt?: Date;
}

export const useNotifications = () => {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    const { getUser } = useAuth();

    const fetchNotifications = useCallback(async () => {
        setLoading(true);

        try {
            const data = await ApiClient.get('/notifications');

            setNotifications(data);
            setUnreadCount(
                data.filter((n: any) => !n.isRead).length
            );
        } catch (error) {
            console.error(
                "Error fetching notifications",
                error
            );
        } finally {
            setLoading(false);
        }
    }, []);

    const markAsRead = async (id: string) => {
        try {
            await ApiClient.patch(
                `/notifications/${id}/read`
            );

            setNotifications(prev =>
                prev.map(n =>
                    n._id === id
                        ? { ...n, isRead: true }
                        : n
                )
            );

            setUnreadCount(prev =>
                Math.max(0, prev - 1)
            );
        } catch (error) {
            console.error(
                "Error marking as read",
                error
            );
        }
    };

    const markAllRead = async () => {
        try {
            await ApiClient.post(
                '/notifications/read-all',
                {}
            );

            setNotifications(prev =>
                prev.map(n => ({
                    ...n,
                    isRead: true
                }))
            );

            setUnreadCount(0);
        } catch (error) {
            console.error(
                "Error marking all read",
                error
            );
        }
    };

    // Initial notification load
    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    // Real-time notifications
    useEffect(() => {
        const userData = getUser();
        const userId = extractId(userData);

        if (!userId) {
            return;
        }

        const SOCKET_URL = BASE_URL?.replace('/api', '');

        const socket = io(SOCKET_URL, {
            query: {
                userId
            }
        });

        socket.on('connect', () => {
            console.log(
                'Notification socket connected:',
                socket.id
            );
        });

        socket.on('connect_error', (error) => {
            console.error(
                'Notification socket error:',
                error
            );
        });

        socket.on('new_notification', (notification) => {
            console.log(
                'New notification received:',
                notification
            );

            setNotifications(prev => [
                notification,
                ...prev
            ]);

            setUnreadCount(prev => prev + 1);

            const notificationSound =
                new Audio('/sounds/beep.mp3');

            notificationSound
                .play()
                .catch(() => {
                    // Browser may block autoplay
                });
        });

        socket.on('disconnect', (reason) => {
            console.log(
                'Notification socket disconnected:',
                reason
            );
        });

        return () => {
            socket.disconnect();
        };
    }, [getUser]);

    return {
        notifications,
        loading,
        unreadCount,
        markAsRead,
        markAllRead,
        refresh: fetchNotifications
    };
};