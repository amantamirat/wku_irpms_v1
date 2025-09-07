import SaveDialog from "@/app/(main)/applicants/components/dialogs/SaveDialog";
import { Applicant } from "@/app/(main)/applicants/models/applicant.model";
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

    const handleLogout = () => {
        props.setVisible(false);
        logout();
    };

    return (
        <>
            <Sidebar visible={props.visible} position="right" onHide={() => props.setVisible(false)}>
                <h2>Welcome, {user?.user_name || 'User'}</h2>
                <p>
                    You are currently logged in. Use the button below to sign out.
                </p>
                <Divider />
                <p>
                    <Button
                        label="Profile"
                        severity="info"
                        icon="pi pi-user"
                        className="w-full"
                        onClick={() => setShowProfileDialog(true)}
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
                    onSave={() => setShowProfileDialog(false)}
                    onHide={() => setShowProfileDialog(false)}
                    setApplicant={function (applicant: Applicant): void {
                        throw new Error("Function not implemented.");
                    }} />
            )}
        </>

    );
}
export default AppUserProfileSidebar;
