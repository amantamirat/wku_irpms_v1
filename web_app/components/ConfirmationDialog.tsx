import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { useRef } from "react";

interface ConfirmDialogProps {
    showDialog: boolean;
    operation?: string;                // e.g. "activate", "approve", "submit"
    item?: string;                     // optional
    onConfirm?: (data?: any) => void;
    onConfirmAsync?: () => Promise<void>;
    onHide: () => void;
}

const ConfirmDialog = (props: ConfirmDialogProps) => {
    const toast = useRef<Toast>(null);

    const op = props.operation || "delete";
    const item = props.item ?? "";

    // 👉 generate clean messages
    const actionText = item ? `${op} ${item}` : op;

    const successDetail = item
        ? `${item} ${op}d successfully`
        : `${op}d successfully`;

    const onOK = async () => {
        try {
            if (props.onConfirm) props.onConfirm();
            else if (props.onConfirmAsync) await props.onConfirmAsync();

            toast.current?.show({
                severity: "success",
                summary: `${op.charAt(0).toUpperCase() + op.slice(1)} Successful`,
                detail: successDetail,
                life: 2000
            });

            setTimeout(() => props.onHide(), 2000);
        } catch (err: any) {
            toast.current?.show({
                severity: "error",
                summary: `Failed to ${op}`,
                detail: err?.message ?? String(err),
                life: 2000
            });
        }
    };

    return (
        <>
            <Toast ref={toast} />

            <Dialog
                visible={props.showDialog}
                style={{ width: "450px" }}
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
                    <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: "2rem" }} />

                    <span>
                        Are you sure you want to&nbsp;
                        <b>{actionText}</b>?
                    </span>
                </div>
            </Dialog>
        </>
    );
};

export default ConfirmDialog;
