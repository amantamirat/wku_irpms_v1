import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { useRef } from "react";

interface ConfirmDialogProps {
    showDialog: boolean;
    operation?: string;
    selectedDataInfo?: string;
    message?: string;
    onConfirm?: () => void;
    onConfirmAsync?: () => Promise<void>;
    onHide: () => void;
}

const ConfirmDialog = (props: ConfirmDialogProps) => {
    const toast = useRef<Toast>(null);

    const onOK = async () => {
        try {
            if (props.onConfirmAsync) {
                await props.onConfirmAsync();
            }
            if (props.onConfirm) {
                props.onConfirm();
            }

            if (props.operation) {
                toast.current?.show({
                    severity: 'success',
                    summary: `${props.operation} performed`,
                    detail: `${props.operation} performed on ${props.selectedDataInfo}`,
                    life: 2000
                });
            } else {
                toast.current?.show({
                    severity: 'success',
                    summary: 'Deleted',
                    detail: `${props.selectedDataInfo} deleted`,
                    life: 2000
                });
            }
            setTimeout(() => props.onHide(), 2000);
        } catch (err) {
            toast.current?.show({
                severity: 'error',
                summary: `Failed to ${props.operation ?? 'delete'} ${props.selectedDataInfo}`,
                detail: '' + err,
                life: 2000
            });
        }
        finally {

        }
    }

    return (
        <>
            <Toast ref={toast} />
            <Dialog
                visible={props.showDialog}
                style={{ width: '450px' }}
                header="Confirm"
                modal
                footer={
                    <>
                        <Button label="Cancel" icon="pi pi-times" text onClick={props.onHide} />
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
                    {props.message && (
                        <span>
                            {props.message}?
                        </span>
                    )}
                </div>
            </Dialog>
        </>

    );
};

export default ConfirmDialog;
