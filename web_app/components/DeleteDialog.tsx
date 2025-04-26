import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";

interface DeleteDialogProps {
    showDeleteDialog: boolean;
    selectedData: any;
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
                    <Button label="Cancel" icon="pi pi-times" text onClick={props.onHide} />
                    <Button label="Delete" icon="pi pi-check" text onClick={props.onDelete} />
                </>
            }
            onHide={props.onHide}
        >
            <div className="flex align-items-center justify-content-center">
                <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                {props.selectedData && (
                    <span>
                        Are you sure you want to delete <b>{props.selectedData._id}</b>?
                    </span>
                )}
            </div>
        </Dialog>
    );
};

export default DeleteDialog;
