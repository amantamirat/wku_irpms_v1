import SaveDialog from "@/app/(main)/applicants/components/dialogs/SaveDialog";
import { Applicant } from "@/app/(main)/applicants/models/applicant.model";
import ChangePasswordDialog from "@/app/(main)/users/dialogs/ChangePassword";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "primereact/button";
import { Divider } from "primereact/divider";
import { Sidebar } from "primereact/sidebar";
import { useState } from "react";

interface UserProfileSidebarProps {
    visible: boolean;
    setVisible: (visible: boolean) => void;
}

function AppUserProfileSidebar(props: UserProfileSidebarProps) {

    const { user, logout } = useAuth();
    const [showProfileDialog, setShowProfileDialog] = useState(false);
    const [showPasswordDialog, setShowPasswordDialog] = useState(false);

    const handleLogout = () => {
        //props.setVisible(false);
        logout();
    };

    return (
        <>
            <Sidebar visible={props.visible} position="right" onHide={() => props.setVisible(false)}>
                <h2>Welcome, {user?.user_name || 'User'}</h2>
                <p>
                    You are currently logged in. Use the buttons below to view your evaluations, edit your profile, change your password, or sign out.
                </p>
                <Divider />
                <p>
                    <Button
                        label="My Evaluations"
                        severity="help"
                        icon="pi pi-list"
                        className="w-full"

                    />
                </p>
                <p>
                    <Button
                        label="My Profile"
                        severity="info"
                        icon="pi pi-user"
                        className="w-full"
                        onClick={() => setShowProfileDialog(true)}
                    />
                </p>
                <p>
                    <Button
                        label="Change Password"
                        severity="warning"
                        icon="pi pi-key"
                        className="w-full"
                        onClick={() => setShowPasswordDialog(true)}
                    />
                </p>
                <p>
                    <Button
                        label="Sign Out"
                        severity="danger"
                        icon="pi pi-sign-out"
                        className="w-full"
                        onClick={handleLogout}
                    />
                </p>

            </Sidebar>
            {user?.linkedApplicant && (
                <SaveDialog
                    visible={showProfileDialog}
                    applicant={user.linkedApplicant as Applicant}
                    onComplete={(savedApplicant: Applicant) => {
                        user.linkedApplicant = savedApplicant;
                        setShowProfileDialog(false)
                    }}
                    onHide={() => setShowProfileDialog(false)}
                />
            )}
            {user?._id && <ChangePasswordDialog
                visible={showPasswordDialog}
                id={user._id}
                onComplete={() => setShowPasswordDialog(false)}
                onHide={() => setShowPasswordDialog(false)}
            />}
        </>

    );
}
export default AppUserProfileSidebar;
