
import { TransitionMap } from '@/hooks/useStateTransitionActions';
import { VerificationStatus } from '../models/verification.model'; // Adjust path if needed

export const VERIFICATION_TRANSITIONS: TransitionMap = {
    [VerificationStatus.submitted]: [
        {
            next: VerificationStatus.verified,
            action: "Verify",
            icon: "pi pi-check",
            severity: "success"
        },
        {
            next: VerificationStatus.rejected,
            action: "Reject",
            icon: "pi pi-times",
            severity: "danger"
        }
    ],

    [VerificationStatus.verified]: [
        {
            next: VerificationStatus.submitted,
            action: "Set Submitted",
            icon: "pi pi-undo",
            severity: "warning"
        }
    ],

    [VerificationStatus.rejected]: [
        {
            next: VerificationStatus.submitted,
            action: "Set Submitted",
            icon: "pi pi-undo",
            severity: "warning"
        }
    ]
};