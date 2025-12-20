import { CallStatus } from "./call.status";

// call.state-machine.ts
export class CallStateMachine {
    
    private static readonly transitions: Record<CallStatus, CallStatus[]> = {
        [CallStatus.planned]: [CallStatus.active],
        [CallStatus.active]: [CallStatus.closed, CallStatus.planned],
        [CallStatus.closed]: [CallStatus.active]
    };

    static canTransition(from: CallStatus, to: CallStatus): boolean {
        return this.transitions[from]?.includes(to) ?? false;
    }

    static validateTransition(from: CallStatus, to: CallStatus): void {
        if (!this.canTransition(from, to)) {
            throw new Error(`Invalid state transition: ${from} → ${to}`);
        }
    }

    static getAllowedTransitions(from: CallStatus): CallStatus[] {
        return this.transitions[from] ?? [];
    }
}