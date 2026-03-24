export interface StatusButtonConfig {
    icon: string;
    severity: "success" | "warning" | "danger" | "info" | "secondary";
    action?: string;
}

export const STATUS_BUTTON_CONFIG: Record<string, StatusButtonConfig> = {
    // ... existing configs (pending, active, etc.)

    // ===== Evaluation & Catalog Lifecycle =====
    draft: {
        icon: "pi pi-pencil", // Changed to pencil to represent 'preparation'
        severity: "secondary",
        action: "Revert to Draft"
    },
    published: {
        icon: "pi pi-globe", // Globe or 'check-circle' represents 'live/published'
        severity: "success",
        action: "Publish Catalog"
    },
    archived: {
        icon: "pi pi-box", // Box icon represents 'storage/retired'
        severity: "secondary", 
        action: "Archive Catalog"
    },

    // ===== Project & Grant flow =====
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
    },
    // Keep your old ones if still needed for other models
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
};