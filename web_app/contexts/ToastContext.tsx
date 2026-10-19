'use client';

import { createContext, useContext, useMemo, useRef, ReactNode } from "react";
import { Toast } from "primereact/toast";

interface ToastApi {
    success: (detail: string, summary?: string) => void;
    error: (error: unknown, summary?: string) => void;
    info: (detail: string, summary?: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

export const useToast = () => {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error("useToast must be used inside ToastProvider");
    return ctx;
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
    const ref = useRef<Toast>(null);

    // Stable object so it is safe to use in hook dependency arrays
    const api = useMemo<ToastApi>(
        () => ({
            success: (detail, summary = "Success") =>
                ref.current?.show({ severity: "success", summary, detail, life: 2000 }),
            info: (detail, summary = "Info") =>
                ref.current?.show({ severity: "info", summary, detail, life: 3000 }),
            error: (error, summary = "Something went wrong") =>
                ref.current?.show({
                    severity: "error",
                    summary,
                    detail: error instanceof Error ? error.message : String(error),
                    life: 4000,
                }),
        }),
        []
    );

    return (
        <ToastContext.Provider value={api}>
            <Toast ref={ref} />
            {children}
        </ToastContext.Provider>
    );
};
