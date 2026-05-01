'use client';
import React from 'react';
import { Sidebar } from 'primereact/sidebar';
import { classNames } from 'primereact/utils';
import { useRouter } from 'next/navigation';
import { NotificationType } from '@/hooks/useNotifications';

interface Props {
    visible: boolean;
    setVisible: (v: boolean) => void;
    notifications: any[];
    onMarkAsRead: (id: string) => void;
    onMarkAllRead: () => void;
}

const AppNotificationSidebar = ({
    visible,
    setVisible,
    notifications,
    onMarkAsRead,
    onMarkAllRead
}: Props) => {

    const router = useRouter();

    // ✅ Relative time (e.g., 2 days ago)
    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = (now.getTime() - date.getTime()) / 1000;

        if (diff < 60) return "Just now";
        if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
        if (diff < 172800) return "Yesterday";
        return `${Math.floor(diff / 86400)} days ago`;
    };

    // ✅ Style by type
    const getNotificationStyle = (type: NotificationType, isRead: boolean) => {
        if (isRead) return "surface-100 opacity-70 hover:opacity-100";

        switch (type) {
            case NotificationType.INFO:
                return "bg-green-50 border-left-3 border-green-500";
            case NotificationType.ERROR:
                return "bg-red-50 border-left-3 border-red-500";
            case NotificationType.WARNING:
                return "bg-yellow-50 border-left-3 border-yellow-500";
            default:
                return "bg-blue-50 border-left-3 border-blue-500";
        }
    };

    // ✅ Icon by type
    const getIcon = (type: string) => {
        return classNames("pi mr-2 text-lg", {
            "pi-check-circle text-green-600": type === "SUCCESS",
            "pi-times-circle text-red-600": type === "ERROR",
            "pi-exclamation-triangle text-yellow-600": type === "WARNING",
            "pi-info-circle text-blue-600": !type || type === "INFO"
        });
    };

    // ✅ Dot color
    const getDotColor = (type: string) => {
        return classNames("absolute border-circle", {
            "bg-green-500": type === "SUCCESS",
            "bg-red-500": type === "ERROR",
            "bg-yellow-500": type === "WARNING",
            "bg-blue-500": !type || type === "INFO"
        });
    };

    return (
        <Sidebar
            visible={visible}
            onHide={() => setVisible(false)}
            position="right"
            className="layout-profile-sidebar w-full md:w-25rem"
        >
            <div className="flex flex-column h-full">

                {/* Header */}
                <div className="flex align-items-center justify-content-between px-4 pb-4 border-bottom-1 surface-border">
                    <span className="text-2xl font-semibold">Notifications</span>

                    {notifications.length > 0 && (
                        <button
                            className="p-link text-primary font-medium"
                            onClick={onMarkAllRead}
                        >
                            Mark all as read
                        </button>
                    )}
                </div>

                {/* Content */}
                <div className="flex-grow-1 overflow-y-auto mt-3">

                    {notifications.length === 0 ? (
                        <div className="flex flex-column align-items-center justify-content-center h-full text-600">
                            <i className="pi pi-bell-slash text-4xl mb-2"></i>
                            <span>No notifications yet</span>
                        </div>
                    ) : (
                        notifications.map((n) => (
                            <div
                                key={n._id}
                                onClick={() => {
                                    if (!n.isRead) onMarkAsRead(n._id);
                                }}
                                className={classNames(
                                    "p-3 mb-2 mx-3 border-round transition-all transition-duration-150 cursor-pointer relative",
                                    getNotificationStyle(n.type, n.isRead)
                                )}
                            >

                                {/* Unread dot */}
                                {!n.isRead && (
                                    <span
                                        className={getDotColor(n.type)}
                                        style={{
                                            width: '8px',
                                            height: '8px',
                                            top: '10px',
                                            right: '10px'
                                        }}
                                    ></span>
                                )}

                                {/* Title + Time */}
                                <div className="flex justify-content-between align-items-start mb-2">
                                    <div className="flex align-items-center">
                                        <i className={getIcon(n.type)}></i>
                                        <span className={classNames("font-semibold", {
                                            'text-900': !n.isRead,
                                            'text-600': n.isRead
                                        })}>
                                            {n.title}
                                        </span>
                                    </div>

                                    <small className="text-500 ml-2 whitespace-nowrap">
                                        {formatTimeAgo(n.createdAt)}
                                    </small>
                                </div>

                                {/* Message */}
                                <p className={classNames("m-0 text-sm line-height-3", {
                                    'text-700': !n.isRead,
                                    'text-500': n.isRead
                                })}>
                                    {n.message}
                                </p>

                                {/* Link */}
                                {n.link && (
                                    <div
                                        className="mt-2 text-xs font-medium cursor-pointer text-primary flex align-items-center gap-1"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            router.push(n.link);
                                            setVisible(false);
                                        }}
                                    >
                                        View Details
                                        <i className="pi pi-arrow-right text-xs"></i>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </Sidebar>
    );
};

export default AppNotificationSidebar;