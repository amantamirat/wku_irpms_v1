import { TransitionMap } from "@/hooks/useStateTransitionActions";
import { AccountStatus } from "./account.model";

export const ACCOUNT_TRANSITIONS: TransitionMap = {
    [AccountStatus.pending]: [
        {
            next: AccountStatus.active,
            action: "Activate",
            icon: "pi pi-check",
            severity: "success"
        }
    ],

    [AccountStatus.active]: [
        {
            next: AccountStatus.suspended,
            action: "Suspend",
            icon: "pi pi-ban",
            severity: "danger"
        },
        {
            next: AccountStatus.pending,
            action: "Set Pending",
            icon: "pi pi-undo",
            severity: "warning"
        }
    ],

    [AccountStatus.suspended]: [
        {
            next: AccountStatus.active,
            action: "Activate",
            icon: "pi pi-check",
            severity: "success"
        }
    ]
};