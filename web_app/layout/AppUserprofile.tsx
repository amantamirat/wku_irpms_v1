'use client';

import { Button } from "primereact/button";
import { Divider } from "primereact/divider";
import { Sidebar } from "primereact/sidebar";
import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import UserDetailDialog from "@/app/(main)/users/components/dialogs/UserDetailDialog";
import { User } from "@/app/(main)/users/models/user.model";
import ChangePasswordDialog from "@/components/ChangePasswordDialog";
import { useAuth } from "@/contexts/auth-context";
import { PERMISSIONS } from "@/types/permissions";

interface QuickLinkItem {
    href: string;
    label: string;
    description: string;
    icon: string;
    permission: string | string[];
}

interface UserProfileSidebarProps {
    visible: boolean;
    setVisible: (visible: boolean) => void;
}

const AppUserProfileSidebar: React.FC<UserProfileSidebarProps> = ({ visible, setVisible }) => {
    const { logout, getUser, hasPermission } = useAuth();
    const router = useRouter();

    // UI State
    const [showApplicantDetailDialog, setShowApplicantDetailDialog] = useState(false);
    const [showPasswordDialog, setShowPasswordDialog] = useState(false);

    // Context Data
    const user = getUser() as User | null;

    const quickLinks: QuickLinkItem[] = useMemo(() => [
        {
            href: '/dashboard/my-projects/',
            label: 'My Projects',
            description: 'Manage your research, project and deliverables',
            icon: 'pi pi-briefcase',
            permission: PERMISSIONS.PROJECT.LOOKUP,
        },
        {
            href: '/dashboard/assigned-applications',
            label: 'Assign Reviewers',
            description: 'Assign and manage evaluators for submitted applications',
            icon: 'pi pi-user-plus',
            permission: 'application:assigned:read',
        },
        {
            href: '/dashboard/my-evaluations',
            label: 'My Evaluations',
            description: 'Evaluate submitted proposals and scores',
            icon: 'pi pi-check-square',
            permission: PERMISSIONS.REVIEWER.LOOKUP,
        },
        {
            href: '/dashboard/my-memberships',
            label: 'My Memberships',
            description: 'View teams and joint project efforts',
            icon: 'pi pi-users',
            permission: PERMISSIONS.COLLABORATOR.LOOKUP,
        }
    ], []);

    const allowedLinks = quickLinks.filter(link => hasPermission(link.permission));

    const handleLogout = () => {
        setVisible(false);
        logout();
    };

    const handleNavigation = (href: string) => {
        setVisible(false);
        router.push(href);
    };

    return (
        <>
            <Sidebar
                visible={visible}
                position="right"
                onHide={() => setVisible(false)}
                className="w-full md:w-25rem"
            >
                <div className="flex flex-column h-full">
                    {/* Header Section */}
                    <section className="mb-2">
                        <h2 className="m-0 text-2xl font-semibold">
                            Welcome, {user?.name ?? 'User'}
                        </h2>
                        <p className="text-color-secondary mt-2 line-height-3">
                            Manage your account settings and profile information below.
                        </p>
                    </section>

                    <Divider />

                    {/* Navigation Actions (Account & Workspace Modules) */}
                    <div className="flex flex-column gap-3 overflow-y-auto pr-1" style={{ maxHeight: 'calc(100vh - 280px)' }}>
                        {user && (
                            <>
                                <Button
                                    label="My Profile"
                                    icon="pi pi-user"
                                    severity="help"
                                    outlined
                                    className="w-full justify-content-start"
                                    onClick={() => setShowApplicantDetailDialog(true)}
                                />

                                <Button
                                    label="Change Password"
                                    icon="pi pi-key"
                                    severity="warning"
                                    outlined
                                    className="w-full justify-content-start"
                                    onClick={() => setShowPasswordDialog(true)}
                                />
                            </>
                        )}

                        {allowedLinks.length > 0 && (
                            <>
                                <Divider className="my-1" />
                                <span className="text-xs text-500 font-bold uppercase tracking-wider px-1">Workspace Modules</span>
                                {allowedLinks.map((link, index) => (
                                    <Button
                                        key={index}
                                        label={link.label}
                                        icon={link.icon}
                                        severity="secondary"
                                        text
                                        className="w-full justify-content-start align-items-start py-2 px-3 surface-hover border-round"
                                        onClick={() => handleNavigation(link.href)}
                                    />
                                ))}
                            </>
                        )}
                    </div>

                    {/* Footer Section */}
                    <div className="mt-auto">
                        <Divider />
                        <Button
                            label="Sign Out"
                            icon="pi pi-sign-out"
                            severity="danger"
                            text
                            className="w-full"
                            onClick={handleLogout}
                        />
                    </div>
                </div>
            </Sidebar>

            {/* Account Dialogs */}
            {user && (
                <>
                    <UserDetailDialog
                        visible={showApplicantDetailDialog}
                        user={user}
                        onHide={() => setShowApplicantDetailDialog(false)}
                    />

                    <ChangePasswordDialog
                        visible={showPasswordDialog}
                        onHide={() => setShowPasswordDialog(false)}
                    />
                </>
            )}
        </>
    );
};

export default AppUserProfileSidebar;