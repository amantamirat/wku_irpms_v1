import { DocStatus } from "./document.enum";

export class DocumentStateMachine {
    private static readonly transitions: Record<DocStatus, DocStatus[]> = {
        [DocStatus.pending]: [DocStatus.submitted],
        [DocStatus.submitted]: [DocStatus.reviewed, 
            DocStatus.pending],
        //[ProjectDocStatus.on_review]: [ProjectDocStatus.reviewed, ProjectDocStatus.submitted],
        [DocStatus.reviewed]: [DocStatus.accepted, DocStatus.rejected, DocStatus.submitted],
        [DocStatus.accepted]: [DocStatus.reviewed],
        [DocStatus.rejected]: [DocStatus.reviewed]
    };

    static canTransition(from: DocStatus, to: DocStatus): boolean {
        return this.transitions[from]?.includes(to) ?? false;
    }

    static validateTransition(from: DocStatus, to: DocStatus): void {
        if (!this.canTransition(from, to)) {
            throw new Error(`Invalid stage transition: ${from} → ${to}`);
        }
    }

    static getAllowedTransitions(from: DocStatus): DocStatus[] {
        return this.transitions[from] ?? [];
    }
}
