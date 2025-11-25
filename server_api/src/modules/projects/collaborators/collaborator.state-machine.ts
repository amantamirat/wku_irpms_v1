import { CollaboratorStatus } from "./collaborator.enum";

// collaborator.state-machine.ts
export class CollaboratorStateMachine {
    private static readonly transitions: Record<CollaboratorStatus, CollaboratorStatus[]> = {
        [CollaboratorStatus.pending]: [CollaboratorStatus.verify],
        [CollaboratorStatus.verify]: [CollaboratorStatus.pending]
    };

    static canTransition(from: CollaboratorStatus, to: CollaboratorStatus): boolean {
        return this.transitions[from]?.includes(to) ?? false;
    }

    static validateTransition(from: CollaboratorStatus, to: CollaboratorStatus): void {
        if (!this.canTransition(from, to)) {
            throw new Error(`Invalid state transition: ${from} → ${to}`);
        }
    }

    static getAllowedTransitions(from: CollaboratorStatus): CollaboratorStatus[] {
        return this.transitions[from] ?? [];
    }
}