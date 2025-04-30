import { Sidebar } from "primereact/sidebar";

interface UserProfileSidebarProps {
    visible: boolean;
    setVisible: (visible: boolean) => void;
}

function AppUserProfileSidebar(props: UserProfileSidebarProps) {
    return (
        <Sidebar visible={props.visible} position="right" onHide={() => props.setVisible(false)}>
            <h2>Welcome, User</h2>
            <p>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
            </p>
        </Sidebar>
    );
}
export default AppUserProfileSidebar;
