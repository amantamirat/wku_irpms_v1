// --- Helpers & Constants ---

import { PhaseStatus } from "./phase.model";

export const PHASE_STATUS_ORDER: PhaseStatus[] = [
    PhaseStatus.proposed,
    PhaseStatus.approved,
    PhaseStatus.active,
    PhaseStatus.terminated,
    PhaseStatus.completed
];

export const PHASE_TRANSITIONS: Record<PhaseStatus, PhaseStatus[]> = {
    [PhaseStatus.proposed]: [
        PhaseStatus.approved
    ],

    [PhaseStatus.approved]: [
        PhaseStatus.active,
        PhaseStatus.proposed
    ],

    [PhaseStatus.active]: [
        PhaseStatus.completed,
        PhaseStatus.terminated,
        PhaseStatus.approved
    ],

    [PhaseStatus.completed]: [
        PhaseStatus.active
    ],

    [PhaseStatus.terminated]: [
        PhaseStatus.active
    ]
};