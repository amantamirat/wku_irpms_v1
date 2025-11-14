import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { useRef } from "react";

interface ConfirmDialogProps {
    showDialog: boolean;
    operation?: string;
    item?: string;
    onConfirm?: (data?: any) => void;
    onConfirmAsync?: () => Promise<void>;
    onHide: () => void;
}

const ConfirmDialog = (props: ConfirmDialogProps) => {
    const toast = useRef<Toast>(null);
    const op = props.operation || "Delete";
    const item = props.item ?? "";


    const showToast = (severity: "success" | "error", summary: string, detail: string) => {
        toast.current?.show({
            severity,
            summary,
            detail,
            life: 2000,
        });
    };

    const onOK = async () => {
        try {

            if (props.onConfirm) {
                props.onConfirm();
            }
            else if (props.onConfirmAsync) {
                await props.onConfirmAsync();
            }
            showToast("success", `${op} Successful`, `${item} ${op.toLowerCase()}ed successfully`);
            setTimeout(() => props.onHide(), 2000);
        } catch (err: any) {
            showToast("error", `Failed to ${op.toLowerCase()} ${item}`, err?.message ?? String(err));
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
                    <span>
                        Are you sure you want to {op} <b>{item}</b>?
                    </span>

                    {/*
                    props.message && (
                        <span>
                            {props.message}?
                        </span>
                    )
                    */}
                </div>
            </Dialog>
        </>

    );
};

export default ConfirmDialog;
