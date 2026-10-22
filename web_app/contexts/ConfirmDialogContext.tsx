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
    reason?: string;
}

export interface ReasonOptions {
    label?: string;
    placeholder?: string;
    required?: boolean;
}

export type ConfirmSeverity = 'danger' | 'warning' | 'success' | 'info';

export interface ConfirmOptions {
    operation?: string;
    item?: string;
    severity?: ConfirmSeverity;
    icon?: string;
    reason?: ReasonOptions;
    onConfirm: (payload: ConfirmPayload) => void | Promise<void>;
    onComplete?: () => void;
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

    const severity = options?.severity || 'danger';

    const getDefaultIcon = (sev: ConfirmSeverity) => {
        switch (sev) {
            case 'danger': return 'pi pi-trash';
            case 'warning': return 'pi pi-exclamation-triangle';
            case 'success': return 'pi pi-check-circle';
            case 'info': default: return 'pi pi-info-circle';
        }
    };

    const dialogIcon = options?.icon || getDefaultIcon(severity);

    const getSeverityStyles = (sev: ConfirmSeverity) => {
        switch (sev) {
            case 'danger':
                return {
                    iconColor: 'text-red-500 bg-red-500/10 border-red-500/20',
                    confirmButtonSeverity: 'danger',
                    headerTitle: 'Are you sure?',
                };
            case 'warning':
                return {
                    iconColor: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
                    confirmButtonSeverity: 'warning',
                    headerTitle: 'Warning',
                };
            case 'success':
                return {
                    iconColor: 'text-green-500 bg-green-500/10 border-green-500/20',
                    confirmButtonSeverity: 'success',
                    headerTitle: 'Confirm Action',
                };
            case 'info':
            default:
                return {
                    iconColor: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
                    confirmButtonSeverity: 'info',
                    headerTitle: 'Confirm',
                };
        }
    };

    const styleConfig = getSeverityStyles(severity);
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
                header={styleConfig.headerTitle}
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
                            severity={styleConfig.confirmButtonSeverity as any}
                            onClick={onOK}
                            loading={loading}
                            disabled={loading || missingReason}
                        />
                    </>
                }
            >
                <div className="flex items-center gap-4">
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border shadow-sm ${styleConfig.iconColor}`}>
                        <i className={dialogIcon} style={{ fontSize: "1.25rem" }} />
                    </div>

                    {/* Uses PrimeReact theme text colors or fallback CSS variables */}
                    <span 
                        className="text-sm leading-relaxed" 
                        style={{ color: "var(--text-color, inherit)" }}
                    >
                        Are you sure you want to&nbsp;
                        <span className="font-semibold" style={{ color: "var(--text-color, currentColor)" }}>
                            {actionText}
                        </span>?
                    </span>
                </div>

                {reasonConfig && (
                    <div className="flex flex-col gap-2 mt-4">
                        <label 
                            htmlFor="confirm-reason" 
                            className="font-medium text-xs opacity-80"
                            style={{ color: "var(--text-color-secondary, inherit)" }}
                        >
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
                            className="w-full text-sm"
                        />
                    </div>
                )}
            </Dialog>
        </ConfirmDialogContext.Provider>
    );
};