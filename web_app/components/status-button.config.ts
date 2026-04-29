export type Status =
    | "draft"
    | "published"
    | "archived"
    | "submitted"
    | "accepted"
    | "rejected"
    | "negotiation"
    | "approved"
    | "granted"
    | "completed"
    | "suspended"
    | "closed"
    | "pending"
    | "verified";

export interface StatusButtonConfig {
    icon: string;
    severity: "success" | "warning" | "danger" | "info" | "secondary";
    action?: string;
    color?: string;

    reverse?: {
        icon: string;
        action: string;
        severity?: "success" | "warning" | "danger" | "info" | "secondary";
    };
}



export const STATUS_BUTTON_CONFIG: Record<string, StatusButtonConfig> = {
    // ... existing configs (pending, active, etc.)

    // ===== Evaluation & Catalog Lifecycle =====
    draft: {
        icon: "pi pi-pencil", // Changed to pencil to represent 'preparation'
        severity: "secondary",
        action: "Revert to Draft",
        color: 'bg-green-100 text-green-700'
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
        action: "Accept",
        reverse: {
            icon: "pi pi-undo",
            action: "Reject",
            severity: "danger"
        },
        color: 'bg-green-100 text-green-700'
    },
    rejected: {
        icon: "pi pi-times-circle",
        severity: "danger",
        action: "Reject",
        color: 'bg-red-100 text-red-700'
    },
    negotiation: {
        icon: "pi pi-comments",
        severity: "warning",
        action: "Negotiate",
        color: 'bg-orange-100 text-orange-700'
    },
    approved: {
        icon: "pi pi-verified",
        severity: "success",
        action: "Approve",
        color: 'bg-teal-100 text-teal-700'
    },
    granted: {
        icon: "pi pi-briefcase",
        severity: "info",
        action: "Grant",
        color: 'bg-indigo-100 text-indigo-700'
    },
    completed: {
        icon: "pi pi-check",
        severity: "success",
        action: "Complete",
        color: 'bg-green-100 text-green-700'
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
    //verification of collaborators
    pending: {
        icon: "pi pi-clock", // Represents waiting / in-progress state
        severity: "warning",
        action: "Mark as Pending"
    },
    verified: {
        icon: "pi pi-check-circle", // Represents approval / verification
        severity: "success",
        action: "Verify Collaborator"
    },
};