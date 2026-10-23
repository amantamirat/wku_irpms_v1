
import { TransitionMap } from "@/hooks/useStateTransitionActions";
import { ReviewerStatus } from "./reviewer.model";

export const REVIEWER_TRANSITIONS: TransitionMap = {
    [ReviewerStatus.pending]: [
        {
            next: ReviewerStatus.verified,
            action: "Verify",
            icon: "pi pi-check",
            severity: "success"
        },
        {
            next: ReviewerStatus.declined,
            action: "Decline",
            icon: "pi pi-times",
            severity: "danger"
        }
    ],

    [ReviewerStatus.declined]: [
        {
            next: ReviewerStatus.pending,
            action: "Set Pending",
            icon: "pi pi-undo",
            severity: "warning"
        }
    ],

    [ReviewerStatus.verified]: [
        {
            next: ReviewerStatus.submitted,
            action: "Submit",
            icon: "pi pi-send",
            severity: "info"
        },
        {
            next: ReviewerStatus.pending,
            action: "Set Pending",
            icon: "pi pi-undo",
            severity: "warning"
        }
    ],

    [ReviewerStatus.submitted]: [
        {
            next: ReviewerStatus.accepted,
            action: "Accept",
            icon: "pi pi-check-circle",
            severity: "success"
        },
        {
            next: ReviewerStatus.rejected,
            action: "Reject",
            icon: "pi pi-times-circle",
            severity: "danger"
        },
        {
            next: ReviewerStatus.verified,
            action: "Set Verified",
            icon: "pi pi-undo",
            severity: "warning"
        }
    ],

    [ReviewerStatus.accepted]: [
        {
            next: ReviewerStatus.submitted,
            action: "Set Submitted",
            icon: "pi pi-undo",
            severity: "warning"
        }
    ],

    [ReviewerStatus.rejected]: [
        {
            next: ReviewerStatus.submitted,
            action: "Set Submitted",
            icon: "pi pi-undo",
            severity: "warning"
        }
    ]
};

export const REVIEWER_USER_TRANSITIONS: TransitionMap = {
    [ReviewerStatus.pending]: [
        {
            next: ReviewerStatus.verified,
            action: "Verify",
            icon: "pi pi-check",
            severity: "success"
        },
        {
            next: ReviewerStatus.declined,
            action: "Decline",
            icon: "pi pi-times",
            severity: "danger"
        }
    ],

    [ReviewerStatus.declined]: [
        {
            next: ReviewerStatus.pending,
            action: "Set Pending",
            icon: "pi pi-undo",
            severity: "warning"
        }
    ],

    [ReviewerStatus.verified]: [
        {
            next: ReviewerStatus.submitted,
            action: "Submit",
            icon: "pi pi-send",
            severity: "info"
        },
        {
            next: ReviewerStatus.pending,
            action: "Set Pending",
            icon: "pi pi-undo",
            severity: "warning"
        }
    ],

    [ReviewerStatus.submitted]: [
        {
            next: ReviewerStatus.verified,
            action: "Set Verified",
            icon: "pi pi-undo",
            severity: "warning"
        }
    ]
};

export const REVIEWER_ADMIN_TRANSITIONS: TransitionMap = {
    [ReviewerStatus.submitted]: [
        {
            next: ReviewerStatus.accepted,
            action: "Accept",
            icon: "pi pi-check-circle",
            severity: "success"
        },
        {
            next: ReviewerStatus.rejected,
            action: "Reject",
            icon: "pi pi-times-circle",
            severity: "danger"
        },
        {
            next: ReviewerStatus.verified,
            action: "Set Verified",
            icon: "pi pi-undo",
            severity: "warning"
        }
    ],

    [ReviewerStatus.accepted]: [
        {
            next: ReviewerStatus.submitted,
            action: "Set Submitted",
            icon: "pi pi-undo",
            severity: "warning"
        }
    ],

    [ReviewerStatus.rejected]: [
        {
            next: ReviewerStatus.submitted,
            action: "Set Submitted",
            icon: "pi pi-undo",
            severity: "warning"
        }
    ]
};



