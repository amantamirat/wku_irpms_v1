import { Dialog } from "primereact/dialog";
import { User } from "../../models/user.model";
import UserDetail from "../UserDetail";

interface UserDetailProps {
    visible: boolean;
    user: User;
    onHide: () => void;
}

const UserDetailDialog = ({ user, visible, onHide }: UserDetailProps) => {
    return (
        <Dialog
            visible={visible}
            onHide={onHide}
            //maximizable
            maximized    
        >
            <h3>User Detail: {user.name}</h3>
            <UserDetail user={user} />
        </Dialog>
    );
}

export default UserDetailDialog;