import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { useRef } from "react";

interface DeleteDialogProps {
    showDeleteDialog: boolean;
    operation?: string;
    selectedDataInfo: string;
    onRemove?: () => void;
    onDelete?: () => Promise<void>;
    onHide: () => void;
}

const DeleteDialog = (props: DeleteDialogProps) => {
    const toast = useRef<Toast>(null);

    const onOK = async () => {
        try {
            if (props.onDelete) {
                await props.onDelete();
            }
            if (props.onRemove) {
                props.onRemove();
            }

            if (props.operation) {
                toast.current?.show({
                    severity: 'success',
                    summary: `${props.operation} performed`,
                    detail: `${props.operation} performed on ${props.selectedDataInfo}`,
                    life: 3000
                });
            } else {
                toast.current?.show({
                    severity: 'success',
                    summary: 'Deleted',
                    detail: `${props.selectedDataInfo} deleted`,
                    life: 3000
                });
            }
        } catch (err) {
            toast.current?.show({
                severity: 'error',
                summary: `Failed to ${props.operation ?? 'delete'} ${props.selectedDataInfo}`,
                detail: '' + err,
                life: 3000
            });
        }
    }

    return (
        <>
            <Dialog
                visible={props.showDeleteDialog}
                style={{ width: '450px' }}
                header="Confirm"
                modal
                footer={
                    <>
                        <Button label="No" icon="pi pi-times" text onClick={props.onHide} />
                        <Button label="Yes" icon="pi pi-check" text onClick={onOK} />
                    </>
                }
                onHide={props.onHide}
            >
                <div className="flex align-items-center justify-content-center">
                    <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                    {props.selectedDataInfo && (
                        <span>
                            Are you sure you want to {props.operation ?? 'delete'} <b>{props.selectedDataInfo}</b>?
                        </span>
                    )}
                </div>
            </Dialog>
        </>

    );
};

export default DeleteDialog;
