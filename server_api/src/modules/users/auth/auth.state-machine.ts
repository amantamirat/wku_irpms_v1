import { AuthStatus } from "./auth.status";

// user.state-machine.ts
export class AuthStateMachine {
    private static readonly transitions: Record<AuthStatus, AuthStatus[]> = {
        [AuthStatus.pending]: [AuthStatus.active],
        [AuthStatus.active]: [AuthStatus.suspended],
        [AuthStatus.suspended]: [AuthStatus.active]
    };

    static canTransition(from: AuthStatus, to: AuthStatus): boolean {
        return this.transitions[from]?.includes(to) ?? false;
    }

    static validateTransition(from: AuthStatus, to: AuthStatus): void {
        if (!this.canTransition(from, to)) {
            throw new Error(`Invalid state transition: ${from} → ${to}`);
        }
    }

    static getAllowedTransitions(from: AuthStatus): AuthStatus[] {
        return this.transitions[from] ?? [];
    }
}