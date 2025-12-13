import { StageStatus } from "./stage.enum";
// stage.state-machine.ts
export class StageStateMachine {
    
    private static readonly transitions: Record<StageStatus, StageStatus[]> = {
        [StageStatus.planned]: [StageStatus.active],
        [StageStatus.active]: [StageStatus.closed, StageStatus.planned],
        [StageStatus.closed]: [StageStatus.active]
    };

    static canTransition(from: StageStatus, to: StageStatus): boolean {
        return this.transitions[from]?.includes(to) ?? false;
    }

    static validateTransition(from: StageStatus, to: StageStatus): void {
        if (!this.canTransition(from, to)) {
            throw new Error(`Invalid state transition: ${from} → ${to}`);
        }
    }

    static getAllowedTransitions(from: StageStatus): StageStatus[] {
        return this.transitions[from] ?? [];
    }
}