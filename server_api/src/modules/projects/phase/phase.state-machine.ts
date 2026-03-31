import { PhaseStatus } from "./phase.status";

export const PHASE_TRANSITIONS: Record<PhaseStatus, PhaseStatus[]> = {
    [PhaseStatus.proposed]: [PhaseStatus.reviewed],
    [PhaseStatus.reviewed]: [PhaseStatus.approved, PhaseStatus.proposed],
    [PhaseStatus.approved]: [PhaseStatus.active, PhaseStatus.reviewed],
    [PhaseStatus.active]: [PhaseStatus.completed, PhaseStatus.approved],
    [PhaseStatus.completed]: [PhaseStatus.active]
};

