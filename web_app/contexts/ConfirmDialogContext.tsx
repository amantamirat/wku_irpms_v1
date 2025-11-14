import { createContext, useContext, useState, useRef, ReactNode } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";

interface ConfirmOptions {
    operation?: string;
    item?: string;
    onConfirm?: () => void;
    onConfirmAsync?: () => Promise<void>;
    onComplete?: () => void;
}

interface ConfirmDialogContextType {
    ask: (options: ConfirmOptions) => void;
}

const ConfirmDialogContext = createContext<ConfirmDialogContextType | null>(null);

export const useConfirmDialog = () => {
    const ctx = useContext(ConfirmDialogContext);
    if (!ctx) throw new Error("useConfirmDialog must be used inside ConfirmDialogProvider");
    return ctx;
};

export const ConfirmDialogProvider = ({ children }: { children: ReactNode }) => {
    const [visible, setVisible] = useState(false);
    const [options, setOptions] = useState<ConfirmOptions>({});
    const [loading, setLoading] = useState(false);
    const toast = useRef<Toast>(null);

    const ask = (opts: ConfirmOptions) => {
        setOptions(opts);
        setVisible(true);
    };

    const op = options.operation || "delete";
    const item = options.item ?? "";
    const actionText = item ? `${op} ${item}` : op;
    const successDetail = item ? `${op} successfully performed on ${item}` : `${op} successfully performed`;

    const close = () => {
        setVisible(false);
        setLoading(false);
    };

    const onOK = async () => {
        try {
            setLoading(true);

            options.onConfirm?.();

            await options.onConfirmAsync?.();

            toast.current?.show({
                severity: "success",
                summary: `${op[0].toUpperCase() + op.slice(1)} Successful`,
                detail: successDetail,
                life: 2000
            });

            options.onComplete?.();


        } catch (err: any) {
            toast.current?.show({
                severity: "error",
                summary: `${op[0].toUpperCase() + op.slice(1)} Failed`,
                detail: err?.message ?? String(err),
                life: 2000
            });

        } finally {
            setLoading(false);
            setTimeout(close, 2000);
        }
    };

    return (
        <ConfirmDialogContext.Provider value={{ ask }}>
            <Toast ref={toast} />
            {children}

            <Dialog
                visible={visible}
                header="Confirm"
                style={{ width: "450px" }}
                modal
                onHide={close}
                footer={
                    <>
                        <Button label="Cancel" icon="pi pi-times" text onClick={close} disabled={loading} />
                        <Button
                            label="Yes"
                            icon="pi pi-check"
                            text
                            onClick={onOK}
                            loading={loading} // spinner while async operation runs
                        />
                    </>
                }
            >
                <div className="flex align-items-center justify-content-center gap-3">
                    <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: "2rem" }} />

                    <span>
                        Are you sure you want to&nbsp;
                        <b>{actionText}</b>?
                    </span>
                </div>
            </Dialog>
        </ConfirmDialogContext.Provider>
    );
};
