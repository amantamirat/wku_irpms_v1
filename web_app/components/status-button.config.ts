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
    },
    // ===== Project إضافات (merged) =====
    draft: {
        icon: "pi pi-pencil",
        severity: "secondary",
        action: "Make it draft"
    },
    submitted: {
        icon: "pi pi-send",
        severity: "info",
        action: "Submit"
    },
    accepted: {
        icon: "pi pi-check-circle",
        severity: "success",
        action: "Accept"
    },
    rejected: {
        icon: "pi pi-times-circle",
        severity: "danger",
        action: "Reject"
    },
    negotiation: {
        icon: "pi pi-comments",
        severity: "warning",
        action: "Negotiate"
    },
    approved: {
        icon: "pi pi-verified",
        severity: "success",
        action: "Approve"
    },
    granted: {
        icon: "pi pi-briefcase",
        severity: "info",
        action: "Grant"
    },
    completed: {
        icon: "pi pi-check",
        severity: "success",
        action: "Complete"
    }
};