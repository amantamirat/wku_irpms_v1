import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";

interface DeleteDialogProps {
    showDeleteDialog: boolean;
    operation?:string;
    selectedDataInfo: string;
    onDelete: () => void;
    onHide: () => void;
}

const DeleteDialog = (props: DeleteDialogProps) => {
    return (
        <Dialog
            visible={props.showDeleteDialog}
            style={{ width: '450px' }}
            header="Confirm"
            modal
            footer={
                <>
                    <Button label="No" icon="pi pi-times" text onClick={props.onHide} />
                    <Button label="Yes" icon="pi pi-check" text onClick={props.onDelete} />
                </>
            }
            onHide={props.onHide}
        >
            <div className="flex align-items-center justify-content-center">
                <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                {props.selectedDataInfo && (
                    <span>
                        Are you sure you want to {props.operation??'delete'} <b>{props.selectedDataInfo}</b>?
                    </span>
                )}
            </div>
        </Dialog>
    );
};

export default DeleteDialog;
