import { DocumentStatus } from "./document.enum";

export class DocumnetStateMachine {
    private static readonly transitions: Record<DocumentStatus, DocumentStatus[]> = {
        [DocumentStatus.pending]: [DocumentStatus.submitted],
        [DocumentStatus.submitted]: [DocumentStatus.on_review, DocumentStatus.pending],
        [DocumentStatus.on_review]: [DocumentStatus.reviewed, DocumentStatus.submitted],
        [DocumentStatus.reviewed]: [DocumentStatus.accepted, DocumentStatus.rejected, DocumentStatus.on_review],
        [DocumentStatus.accepted]: [DocumentStatus.reviewed],
        [DocumentStatus.rejected]: [DocumentStatus.reviewed]
    };

    static canTransition(from: DocumentStatus, to: DocumentStatus): boolean {
        return this.transitions[from]?.includes(to) ?? false;
    }

    static validateTransition(from: DocumentStatus, to: DocumentStatus): void {
        if (!this.canTransition(from, to)) {
            throw new Error(`Invalid stage transition: ${from} → ${to}`);
        }
    }

    static getAllowedTransitions(from: DocumentStatus): DocumentStatus[] {
        return this.transitions[from] ?? [];
    }
}
