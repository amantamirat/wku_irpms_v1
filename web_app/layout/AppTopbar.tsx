/* eslint-disable @next/next/no-img-element */

import Link from 'next/link';
import { classNames } from 'primereact/utils';
import React, { forwardRef, useContext, useImperativeHandle, useRef, useState } from 'react';
import { AppTopbarRef } from '@/types';
import { LayoutContext } from './context/layoutcontext';
import AppUserProfileSidebar from './AppUserprofile';
import AppNotificationSidebar from './AppNotificationSidebar';
import { useNotifications } from '@/hooks/useNotifications';
import { Badge } from 'primereact/badge';

const AppTopbar = forwardRef<AppTopbarRef>((props, ref) => {
    const { layoutConfig, layoutState, onMenuToggle, showProfileSidebar } = useContext(LayoutContext);
    const menubuttonRef = useRef(null);
    const topbarmenuRef = useRef(null);
    const topbarmenubuttonRef = useRef(null);
    const [showUserProfileSidebar, setShowUserProfileSidebar] = useState(false);
    const [showNotificationSidebar, setShowNotificationSidebar] = useState(false);

    const { unreadCount, notifications, markAsRead, markAllRead } = useNotifications();

    useImperativeHandle(ref, () => ({
        menubutton: menubuttonRef.current,
        topbarmenu: topbarmenuRef.current,
        topbarmenubutton: topbarmenubuttonRef.current
    }));

    return (
        <div className="layout-topbar">

            <Link href="/" className="layout-topbar-logo">
                <img src={`/images/wku_logo.png`} alt="logo" />
                <span>WKU IRPMS</span>
            </Link>


            <button ref={menubuttonRef} type="button" className="p-link layout-menu-button layout-topbar-button" onClick={onMenuToggle}>
                <i className="pi pi-bars" />
            </button>

            <button ref={topbarmenubuttonRef} type="button" className="p-link layout-topbar-menu-button layout-topbar-button" onClick={showProfileSidebar}>
                <i className="pi pi-ellipsis-v" />
            </button>

            <div ref={topbarmenuRef} className={classNames('layout-topbar-menu', { 'layout-topbar-menu-mobile-active': layoutState.profileSidebarVisible })}>
                <button
                    type="button"
                    className="p-link layout-topbar-button"
                    onClick={() => setShowNotificationSidebar(true)}
                    style={{ position: 'relative', overflow: 'visible' }}
                >
                    <i className="pi pi-bell" style={{ fontSize: '1.5rem' }}></i>

                    {unreadCount > 0 && (
                        <span
                            className="p-badge p-badge-danger"
                            style={{
                                position: 'absolute',
                                top: '0',
                                right: '0',
                                transform: 'translate(25%, -25%)', // Perfectly centers it on the corner
                                minWidth: '1.25rem',
                                height: '1.25rem',
                                lineHeight: '1.25rem',
                                borderRadius: '50%',
                                fontSize: '0.7rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                zIndex: 10,
                                color: '#ffffff',
                                backgroundColor: '#ef4444' // Standard red
                            }}
                        >
                            {unreadCount}
                        </span>
                    )}
                    <span>Notification</span>
                </button>
                <button type="button" className="p-link layout-topbar-button" onClick={() => setShowUserProfileSidebar(true)}>
                    <i className="pi pi-user"></i>
                    <span>Profile</span>
                </button>
                {
                    /**
                     * <Link href="/documentation">
                    <button type="button" className="p-link layout-topbar-button">
                        <i className="pi pi-cog"></i>
                        <span>Settings</span>
                    </button>
                </Link>
                     */
                }
                {/* Notification Sidebar Overlay */}
                {showNotificationSidebar && (
                    <AppNotificationSidebar
                        visible={showNotificationSidebar}
                        setVisible={setShowNotificationSidebar}
                        notifications={notifications}
                        onMarkAsRead={markAsRead}
                        onMarkAllRead={markAllRead}
                    />
                )}

                {/* Profile Sidebar Overlay */}
                {showUserProfileSidebar && (
                    <AppUserProfileSidebar
                        visible={showUserProfileSidebar}
                        setVisible={setShowUserProfileSidebar}
                    />
                )}
            </div>
        </div>
    );
});

AppTopbar.displayName = 'AppTopbar';

export default AppTopbar;
