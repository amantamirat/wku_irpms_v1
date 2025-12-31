import { ReviewerStatus } from "./reviewer.status";

// reviewer.state-machine.ts
export class ReviewerStateMachine {
    private static readonly transitions: Record<ReviewerStatus, ReviewerStatus[]> = {
        [ReviewerStatus.pending]: [ReviewerStatus.verified],
        [ReviewerStatus.verified]: [ReviewerStatus.submitted, ReviewerStatus.pending],
        [ReviewerStatus.submitted]: [ReviewerStatus.approved, ReviewerStatus.verified],
        [ReviewerStatus.approved]: [ReviewerStatus.submitted]
    };

    static canTransition(from: ReviewerStatus, to: ReviewerStatus): boolean {
        return this.transitions[from]?.includes(to) ?? false;
    }

    static validateTransition(from: ReviewerStatus, to: ReviewerStatus): void {
        if (!this.canTransition(from, to)) {
            throw new Error(`Invalid state transition: ${from} → ${to}`);
        }
    }

    static getAllowedTransitions(from: ReviewerStatus): ReviewerStatus[] {
        return this.transitions[from] ?? [];
    }
}