import { Dialog } from "primereact/dialog";
import { User } from "../../models/user.model";
import UserDetail from "../UserDetail";

interface ApplicantDetailProps {
    visible: boolean;
    applicant: User;
    onHide: () => void;
}

const ApplicantDetailDialog = ({ applicant, visible, onHide }: ApplicantDetailProps) => {
    return (
        <Dialog
            visible={visible}
            onHide={onHide}
            //maximizable
            maximized    
        >
            <h3>Applicant Detail: {applicant.name}</h3>
            <UserDetail user={applicant} />
        </Dialog>
    );
}

export default ApplicantDetailDialog;