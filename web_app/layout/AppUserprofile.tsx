import { useAuth } from "@/contexts/auth-context";
import { Button } from "primereact/button";
import { Divider } from "primereact/divider";
import { Sidebar } from "primereact/sidebar";

interface UserProfileSidebarProps {
    visible: boolean;
    setVisible: (visible: boolean) => void;
}

function AppUserProfileSidebar(props: UserProfileSidebarProps) {

    const { user, logout } = useAuth();

    const handleLogout = () => {
        props.setVisible(false);
        logout();
    };
    return (
        <Sidebar visible={props.visible} position="right" onHide={() => props.setVisible(false)}>
            <h2>Welcome, {user?.user_name || 'User'}</h2>
            <p>
                You are currently logged in. Use the button below to sign out.
            </p>
            <Divider />
            <Button
                label="Sign Out"
                severity="danger"
                icon="pi pi-sign-out"
                className="w-full"
                onClick={handleLogout}
            />
        </Sidebar>
    );
}
export default AppUserProfileSidebar;
