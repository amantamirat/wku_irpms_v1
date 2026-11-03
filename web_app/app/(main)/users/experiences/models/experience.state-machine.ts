import { TransitionMap } from "@/hooks/useStateTransitionActions";

export enum ExperienceStatus {
    PENDING = 'pending',
    VERIFIED = 'verified'
}

export const EXPERIENCE_TRANSITIONS: TransitionMap = {
    [ExperienceStatus.PENDING]: [
        {
            next: ExperienceStatus.VERIFIED,
            action: "Verify",
            icon: "pi pi-check",
            severity: "success",
            requireReason: true
        }
    ],

    [ExperienceStatus.VERIFIED]: [
        {
            next: ExperienceStatus.PENDING,
            action: "Set Pending",
            icon: "pi pi-undo",
            severity: "warning",
            requireReason: true
        }
    ]
};