import { Dialog } from "primereact/dialog";
import { Call } from "../../calls/models/call.model";
import { FileUpload } from "primereact/fileupload";

interface ApplyDialogProps {
    visible: boolean;
    call: Call;
    onHide: () => void;
}

export default function ApplyDialog(props: ApplyDialogProps) {

    const { visible, call, onHide } = props;

    
    return (

        <Dialog
            header="Apply for Call"
            visible={visible}
            style={{ width: '40vw' }}
            onHide={() => onHide}>

            <div className="flex flex-column gap-3">
                <h3>{call.title}</h3>
                <p>Please upload your application PDF:</p>
                <FileUpload
                    name="application"
                    url="/api/upload" // replace with your backend API
                    accept=".pdf"
                    maxFileSize={10000000} // 10MB
                    chooseLabel="Select PDF"
                    uploadLabel="Upload"
                    mode="basic"
                />
            </div>
                
        </Dialog>
    )
}