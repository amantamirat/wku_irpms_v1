import { TransitionMap } from "@/hooks/useStateTransitionActions";
import { ApplicationStatus } from "./application.model";

export const APPLICATION_TRANSITIONS: TransitionMap = {
    [ApplicationStatus.submitted]: [
        {
            next: ApplicationStatus.shortlisted,
            action: "Shortlist",
            icon: "pi pi-check",
            severity: "success"
        },
        {
            next: ApplicationStatus.notShortlisted,
            action: "Exclude",
            icon: "pi pi-times",
            severity: "danger"
        }
    ],

    [ApplicationStatus.shortlisted]: [
        {
            next: ApplicationStatus.submitted,
            action: "Reopen",
            icon: "pi pi-undo",
            severity: "warning"
        },
        {
            next: ApplicationStatus.accepted,
            action: "Accept",
            icon: "pi pi-check",
            severity: "success"
        },
        {
            next: ApplicationStatus.rejected,
            action: "Reject",
            icon: "pi pi-times",
            severity: "danger"
        }
    ],

    // Reopening an excluded application returns it to the
    // submitted stage so it can be considered for shortlisting again.
    [ApplicationStatus.notShortlisted]: [
        {
            next: ApplicationStatus.submitted,
            action: "Reopen",
            icon: "pi pi-undo",
            severity: "warning"
        }
    ],

    // Reopening an accepted application returns it to the
    // shortlisted stage for reconsideration; it is not resubmitted.
    [ApplicationStatus.accepted]: [
        {
            next: ApplicationStatus.shortlisted,
            action: "Reopen",
            icon: "pi pi-undo",
            severity: "warning"
        }
    ],

    // Reopening a rejected application returns it to the
    // shortlisted stage for reconsideration; it is not resubmitted.
    [ApplicationStatus.rejected]: [
        {
            next: ApplicationStatus.shortlisted,
            action: "Reopen",
            icon: "pi pi-undo",
            severity: "warning"
        }
    ]
};
