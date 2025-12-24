import { PhaseStatus } from "./phase.status";

// phase.state-machine.ts
export class PhaseStateMachine {

    private static readonly transitions: Record<PhaseStatus, PhaseStatus[]> = {
        [PhaseStatus.proposed]: [PhaseStatus.verified],
        [PhaseStatus.verified]: [PhaseStatus.approved, PhaseStatus.proposed],
        [PhaseStatus.approved]: [PhaseStatus.verified]
    };

    static canTransition(from: PhaseStatus, to: PhaseStatus): boolean {
        return this.transitions[from]?.includes(to) ?? false;
    }

    static validateTransition(from: PhaseStatus, to: PhaseStatus): void {
        if (!this.canTransition(from, to))
            throw new Error(`Invalid state transition: ${from} → ${to}`);
    }

    static getAllowedTransitions(from: PhaseStatus): PhaseStatus[] {
        return this.transitions[from] ?? [];
    }
}