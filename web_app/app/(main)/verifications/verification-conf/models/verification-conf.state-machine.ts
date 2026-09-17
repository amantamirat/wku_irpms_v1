import { TransitionMap } from "@/hooks/useStateTransitionActions";
import { VerificationConfigurationStatus } from "./verification-conf.model";

export const VERIFICATION_CONFIGURATION_TRANSITIONS: TransitionMap = {
    [VerificationConfigurationStatus.active]: [
        {
            next: VerificationConfigurationStatus.closed,
            action: "Close",
            icon: "pi pi-times",
            severity: "danger"
        }
    ],

    [VerificationConfigurationStatus.closed]: [
        {
            next: VerificationConfigurationStatus.active,
            action: "Reopen",
            icon: "pi pi-refresh",
            severity: "success"
        }
    ]
};