import { Dialog } from "primereact/dialog";
import { Applicant } from "../../models/applicant.model";
import ApplicantDetail from "../ApplicantDetail";

interface ApplicantDetailProps {
    visible: boolean;
    applicant: Applicant;
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
            <h3>Applicant Detail: {applicant.first_name} {applicant.last_name}</h3>
            <ApplicantDetail applicant={applicant} />
        </Dialog>
    );
}

export default ApplicantDetailDialog;