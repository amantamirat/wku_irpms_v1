import { TransitionMap } from "@/hooks/useStateTransitionActions";
import { EvaluationStatus } from "./evaluation.model";

export const EVAL_TRANSITIONS: TransitionMap = {
    [EvaluationStatus.draft]: [
        {
            next: EvaluationStatus.published,
            action: "Publish",
            icon: "pi pi-check",
            severity: "success"
        }
    ],

    [EvaluationStatus.published]: [
        {
            next: EvaluationStatus.archived,
            action: "Archive",
            icon: "pi pi-lock",
            severity: "danger"
        },
        {
            next: EvaluationStatus.draft,
            action: "Set Draft",
            icon: "pi pi-undo",
            severity: "warning",
            requireReason: true,
        }
    ],

    [EvaluationStatus.archived]: [
        {
            next: EvaluationStatus.published,
            action: "Republish",
            icon: "pi pi-refresh",
            severity: "success"
        }
    ]
};