import React, { useState } from "react";
import { Sidebar } from "primereact/sidebar";
import { Button } from "primereact/button";
import { Divider } from "primereact/divider";

import { useAuth } from "@/contexts/auth-context";
import { User } from "@/app/(main)/users/models/user.model";
import UserDetailDialog from "@/app/(main)/users/components/dialogs/UserDetailDialog";
import SaveDialog from "@/app/(main)/accounts/components/SaveAccount";
import ChangePasswordDialog from "@/components/ChangePasswordDialog";

interface UserProfileSidebarProps {
    visible: boolean;
    setVisible: (visible: boolean) => void;
}

const AppUserProfileSidebar: React.FC<UserProfileSidebarProps> = ({ visible, setVisible }) => {
    const { logout, getUser } = useAuth();

    // UI State
    const [showApplicantDetailDialog, setShowApplicantDetailDialog] = useState(false);
    const [showPasswordDialog, setShowPasswordDialog] = useState(false);

    // Context Data
    const user = getUser() as User | null;

    const handleLogout = () => {
        setVisible(false);
        logout();
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

                    {/* Navigation Actions */}
                    <div className="flex flex-column gap-3">
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
                    //toast={toast} // Optional: for success messages
                    />
                </>
            )}
        </>
    );
};

export default AppUserProfileSidebar;