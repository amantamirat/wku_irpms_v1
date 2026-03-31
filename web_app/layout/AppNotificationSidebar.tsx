import React from 'react';
import { Sidebar } from 'primereact/sidebar';
import { classNames } from 'primereact/utils';
import { useRouter } from 'next/navigation';

interface Props {
    visible: boolean;
    setVisible: (v: boolean) => void;
    notifications: any[];
    onMarkAsRead: (id: string) => void;
    onMarkAllRead: () => void;
}

const AppNotificationSidebar = ({ visible, setVisible, notifications, onMarkAsRead, onMarkAllRead }: Props) => {

    const router = useRouter();
    // Simple helper to format dates (you can use date-fns or similar later)
    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <Sidebar
            visible={visible}
            onHide={() => setVisible(false)}
            position="right"
            className="layout-profile-sidebar w-full md:w-25rem"
        >
            <div className="flex flex-column h-full">
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
                                onClick={() => !n.isRead && onMarkAsRead(n._id)}
                                className={classNames(
                                    "p-3 mb-2 mx-3 border-round transition-colors transition-duration-150 cursor-pointer relative",
                                    {
                                        'surface-100 hover:surface-200': n.isRead,
                                        'blue-50 hover:surface-200 border-left-3 border-blue-500': !n.isRead
                                    }
                                )}
                            >
                                {/* Unread indicator dot */}
                                {!n.isRead && (
                                    <span
                                        className="absolute border-circle bg-blue-500"
                                        style={{ width: '8px', height: '8px', top: '10px', right: '10px' }}
                                    ></span>
                                )}

                                <div className="flex justify-content-between mb-2">
                                    <span className={classNames("font-bold", { 'text-900': !n.isRead, 'text-600': n.isRead })}>
                                        {n.title}
                                    </span>
                                    <small className="text-500">{formatTime(n.createdAt)}</small>
                                </div>
                                <p className={classNames("m-0 text-sm", { 'text-700': !n.isRead, 'text-500': n.isRead })}>
                                    {n.message}
                                </p>

                                {n.link && (
                                    <div
                                        className="mt-2 text-xs text-blue-600 font-medium cursor-pointer"
                                        onClick={(e) => {
                                            e.stopPropagation(); // prevent parent click
                                            router.push(n.link);
                                            setVisible(false);
                                        }}
                                    >
                                        View Details <i className="pi pi-arrow-right text-xs"></i>
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