import { UserStatus } from "./user.status";

// user.state-machine.ts
export class UserStateMachine {
    private static readonly transitions: Record<UserStatus, UserStatus[]> = {
        [UserStatus.pending]: [UserStatus.active],
        [UserStatus.active]: [UserStatus.suspended],
        [UserStatus.suspended]: [UserStatus.active]
    };

    static canTransition(from: UserStatus, to: UserStatus): boolean {
        return this.transitions[from]?.includes(to) ?? false;
    }

    static validateTransition(from: UserStatus, to: UserStatus): void {
        if (!this.canTransition(from, to)) {
            throw new Error(`Invalid state transition: ${from} → ${to}`);
        }
    }

    static getAllowedTransitions(from: UserStatus): UserStatus[] {
        return this.transitions[from] ?? [];
    }
}