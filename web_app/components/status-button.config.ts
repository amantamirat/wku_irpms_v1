export interface StatusButtonConfig {
    icon: string;
    severity: "success" | "warning" | "danger" | "info" | "secondary";
    action?: string;
}

export const STATUS_BUTTON_CONFIG: Record<string, StatusButtonConfig> = {
    pending: {
        icon: "pi pi-clock",
        severity: "warning",
        action: "Send to Pending"
    },
    active: {
        icon: "pi pi-check",
        severity: "success",
        action: "Activate"
    },
    suspended: {
        icon: "pi pi-ban",
        severity: "danger",
        action: "Suspend"
    },
    closed: {
        icon: "pi pi-lock",
        severity: "danger",
        action: "Close"
    }
};