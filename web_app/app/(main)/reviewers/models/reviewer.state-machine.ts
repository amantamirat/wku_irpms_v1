import { TransitionMap } from "@/hooks/useStateTransitionActions";
import { ReviewerStatus } from "./reviewer.model";

export const REVIEWER_TRANSITIONS: TransitionMap = {
    [ReviewerStatus.pending]: [
        {
            next: ReviewerStatus.accepted,
            action: "Accept",
            icon: "pi pi-check",
            severity: "success"
        },
        {
            next: ReviewerStatus.decliend,
            action: "Decline",
            icon: "pi pi-times",
            severity: "danger"
        }
    ],

    [ReviewerStatus.decliend]: [
        {
            next: ReviewerStatus.pending,
            action: "Set Pending",
            icon: "pi pi-undo",
            severity: "warning"
        }
    ],

    [ReviewerStatus.accepted]: [
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
            next: ReviewerStatus.approved,
            action: "Approve",
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
            next: ReviewerStatus.accepted,
            action: "Set Accepted",
            icon: "pi pi-undo",
            severity: "warning"
        }
    ],

    [ReviewerStatus.approved]: [
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
            next: ReviewerStatus.accepted,
            action: "Accept",
            icon: "pi pi-check",
            severity: "success"
        },
        {
            next: ReviewerStatus.decliend,
            action: "Decline",
            icon: "pi pi-times",
            severity: "danger"
        }
    ],
    [ReviewerStatus.decliend]: [
        {
            next: ReviewerStatus.pending,
            action: "Set Pending",
            icon: "pi pi-undo",
            severity: "warning"
        }
    ],
    [ReviewerStatus.accepted]: [
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
            action: "Set Accepted",
            icon: "pi pi-undo",
            severity: "warning"
        }
    ],
};

export const REVIEWER_ADMIN_TRANSITIONS: TransitionMap = {

    [ReviewerStatus.submitted]: [
        {
            next: ReviewerStatus.approved,
            action: "Approve",
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
            next: ReviewerStatus.accepted,
            action: "Set Accepted",
            icon: "pi pi-undo",
            severity: "warning"
        }
    ],

    [ReviewerStatus.approved]: [
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

/*
export const REVIEWER_STATUS_ORDER: ReviewerStatus[] = [
    ReviewerStatus.pending,
    ReviewerStatus.accepted,
    ReviewerStatus.submitted,
    ReviewerStatus.approved
];

export const REVIEWER_TRANSITIONS: Record<ReviewerStatus, ReviewerStatus[]> = {
    [ReviewerStatus.pending]: [ReviewerStatus.accepted],
    [ReviewerStatus.accepted]: [ReviewerStatus.submitted, ReviewerStatus.pending],
    [ReviewerStatus.submitted]: [ReviewerStatus.approved, ReviewerStatus.accepted],
    [ReviewerStatus.approved]: [ReviewerStatus.submitted]
};

export const REVIEWER_USER_TRANSITIONS: Partial<Record<ReviewerStatus, ReviewerStatus[]>> = {
    [ReviewerStatus.pending]: [ReviewerStatus.accepted],
    [ReviewerStatus.accepted]: [ReviewerStatus.submitted, ReviewerStatus.pending],
};

export const REVIEWER_ADMIN_TRANSITIONS: Partial<Record<ReviewerStatus, ReviewerStatus[]>> = {
    [ReviewerStatus.submitted]: [ReviewerStatus.approved, ReviewerStatus.accepted],
    [ReviewerStatus.approved]: [ReviewerStatus.submitted]
};

*/