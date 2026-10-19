'use client';

import {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState,
    ReactNode,
} from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { InputTextarea } from "primereact/inputtextarea";
import { capitalize } from "@/utils/utils";
import { useToast } from "./ToastContext";


export interface ConfirmPayload {
    /** Trimmed text from the reason box. Undefined when there is no reason box or it was left empty. */
    reason?: string;
}

export interface ReasonOptions {
    label?: string;
    placeholder?: string;
    required?: boolean;
}

export interface ConfirmOptions {
    operation?: string;
    item?: string;
    /** Custom icon class (e.g. "pi pi-trash", "pi pi-check"). Defaults to "pi pi-exclamation-triangle". */
    icon?: string;
    /** Shows a reason box in the dialog. */
    reason?: ReasonOptions;
    onConfirm: (payload: ConfirmPayload) => void | Promise<void>;
    onComplete?: () => void;
    /** Called when onConfirm throws. The dialog stays open so the user can retry. */
    onError?: (error: unknown) => void;
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
    const [options, setOptions] = useState<ConfirmOptions | null>(null);
    const [loading, setLoading] = useState(false);
    const [reason, setReason] = useState("");
    const toast = useToast();

    // Stable references: consumers put `confirm` in hook deps, so a new object
    // on every provider render (e.g. when `loading` flips) would rebuild their actions.
    const ask = useCallback((opts: ConfirmOptions) => {
        setOptions(opts);
        setReason("");
        setLoading(false);
        setVisible(true);
    }, []);

    const value = useMemo(() => ({ ask }), [ask]);

    const op = options?.operation || "delete";
    const item = options?.item ?? "";
    const actionText = item ? `${op} ${item}` : op;
    const successDetail = item
        ? `${op} successfully performed on ${item}`
        : `${op} successfully performed`;

    // Fallback to exclamation-triangle if no custom icon is provided
    const dialogIcon = options?.icon || "pi pi-exclamation-triangle";

    const reasonConfig = options?.reason;
    const trimmedReason = reason.trim();
    const missingReason = !!reasonConfig?.required && !trimmedReason;

    const close = useCallback(() => {
        setVisible(false);
        setLoading(false);
    }, []);

    const onOK = async () => {
        if (!options?.onConfirm || loading || missingReason) return;

        setLoading(true);
        try {
            await options.onConfirm({ reason: trimmedReason || undefined });
        } catch (err) {
            // No toast here: the caller decides how to show errors.
            // Keep the dialog open so the user can retry or cancel.
            setLoading(false);
            if (options.onError) options.onError(err);
            else console.error("Confirm action failed:", err);
            return;
        }

        toast.success(successDetail, `${capitalize(op)} Successful`);

        options.onComplete?.();
        close();
    };

    return (
        <ConfirmDialogContext.Provider value={value}>
            {children}

            <Dialog
                visible={visible}
                header="Confirm"
                style={{ width: "450px" }}
                modal
                closable={!loading}
                closeOnEscape={!loading}
                onHide={() => {
                    if (!loading) close();
                }}
                footer={
                    <>
                        <Button label="Cancel" icon="pi pi-times" text onClick={close} disabled={loading} />
                        <Button
                            label="Yes"
                            icon="pi pi-check"
                            text
                            onClick={onOK}
                            loading={loading}
                            disabled={loading || missingReason}
                        />
                    </>
                }
            >
                <div className="flex align-items-center justify-content-center gap-3">
                    <i className={`${dialogIcon} mr-3`} style={{ fontSize: "2rem" }} />

                    <span>
                        Are you sure you want to&nbsp;
                        <b>{actionText}</b>?
                    </span>
                </div>

                {reasonConfig && (
                    <div className="flex flex-column gap-2 mt-4">
                        <label htmlFor="confirm-reason" className="font-medium">
                            {reasonConfig.label ?? "Reason"}
                            {reasonConfig.required ? " *" : " (optional)"}
                        </label>
                        <InputTextarea
                            id="confirm-reason"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder={reasonConfig.placeholder ?? "Add a reason..."}
                            rows={3}
                            autoResize
                            autoFocus
                            disabled={loading}
                            className="w-full"
                        />
                    </div>
                )}
            </Dialog>
        </ConfirmDialogContext.Provider>
    );
};