import ApplicantDetailDialog from "@/app/(main)/applicants/components/dialogs/ApplicantDetailDialog";
import { Applicant } from "@/app/(main)/applicants/models/applicant.model";
import SaveDialog from "@/app/(main)/users/dialogs/SaveDialog";
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
    const [showApplicantDetailDialog, setShowApplicantDetailDialog] = useState(false);
    const [showProfileDialog, setShowProfileDialog] = useState(false);
    const [showPasswordDialog, setShowPasswordDialog] = useState(false);

    const handleLogout = () => {
        //props.setVisible(false);
        logout();
    };

    return (
        <>
            <Sidebar visible={props.visible} position="right" onHide={() => props.setVisible(false)}>
                <h2>Welcome, {(user?.applicant) ? (user?.applicant as Applicant).name : 'User'}</h2>
                <p>
                    You are signed in. Use the buttons below to access your account features.
                </p>
                <Divider />
                {user?.applicant &&
                    <>
                        <p>
                            <Button
                                label="My Profile"
                                severity="help"
                                icon="pi pi-list"
                                className="w-full"
                                onClick={() => setShowApplicantDetailDialog(true)}
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
                    </>
                }

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

            {user?.applicant && (
                <ApplicantDetailDialog
                    visible={showApplicantDetailDialog}
                    applicant={user.applicant as Applicant}
                    onHide={() => setShowApplicantDetailDialog(false)}
                />
            )}
            {
                /** 
                 *  {user?.linkedApplicant && (
                <SaveDialog
                    visible={showProfileDialog}
                    applicant={user.linkedApplicant as Applicant}
                    onComplete={(savedApplicant: Applicant) => {
                        user.linkedApplicant = savedApplicant;
                        setShowProfileDialog(false)
                    }}
                    onHide={() => setShowProfileDialog(false)}
                />
            )}*/}

            {(user?._id && user.applicant) && <SaveDialog
                visible={showPasswordDialog}
                user={user}
                enableCurrentPassword={true}
                onComplete={() => setShowPasswordDialog(false)}
                onHide={() => setShowPasswordDialog(false)}
            />}




        </>

    );
}
export default AppUserProfileSidebar;
