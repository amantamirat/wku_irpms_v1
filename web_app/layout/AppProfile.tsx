import { Sidebar } from "primereact/sidebar";

interface ProfileSidebarProps {
    visible: boolean;
    setVisible: (visible: boolean) => void;
}
function AppProfileSidebar(props: ProfileSidebarProps) {
    <Sidebar visible={props.visible} position="right" onHide={() => props.setVisible(false)}>
        <h2>Right Sidebar</h2>
        <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
            Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
        </p>
    </Sidebar>
}
export default AppProfileSidebar;