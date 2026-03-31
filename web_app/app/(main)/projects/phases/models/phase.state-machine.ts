// --- Helpers & Constants ---

import { PhaseStatus } from "./phase.model";

export const PHASE_STATUS_ORDER: PhaseStatus[] = [
    PhaseStatus.proposed,
    PhaseStatus.reviewed,
    PhaseStatus.approved,
    PhaseStatus.active,
    PhaseStatus.completed
];

export const PHASE_TRANSITIONS: Record<PhaseStatus, PhaseStatus[]> = {
    proposed: [PhaseStatus.reviewed],
    reviewed: [PhaseStatus.approved, PhaseStatus.proposed],
    approved: [PhaseStatus.active, PhaseStatus.reviewed],
    active: [PhaseStatus.completed, PhaseStatus.approved],
    completed: [PhaseStatus.active]
};