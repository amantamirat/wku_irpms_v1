import { ProjectDocStatus } from "./document.enum";

export class DocumentStateMachine {
    private static readonly transitions: Record<ProjectDocStatus, ProjectDocStatus[]> = {
        [ProjectDocStatus.pending]: [ProjectDocStatus.submitted],
        [ProjectDocStatus.submitted]: [ProjectDocStatus.on_review, ProjectDocStatus.pending],
        [ProjectDocStatus.on_review]: [ProjectDocStatus.reviewed, ProjectDocStatus.submitted],
        [ProjectDocStatus.reviewed]: [ProjectDocStatus.accepted, ProjectDocStatus.rejected, ProjectDocStatus.on_review],
        [ProjectDocStatus.accepted]: [ProjectDocStatus.reviewed],
        [ProjectDocStatus.rejected]: [ProjectDocStatus.reviewed]
    };

    static canTransition(from: ProjectDocStatus, to: ProjectDocStatus): boolean {
        return this.transitions[from]?.includes(to) ?? false;
    }

    static validateTransition(from: ProjectDocStatus, to: ProjectDocStatus): void {
        if (!this.canTransition(from, to)) {
            throw new Error(`Invalid stage transition: ${from} → ${to}`);
        }
    }

    static getAllowedTransitions(from: ProjectDocStatus): ProjectDocStatus[] {
        return this.transitions[from] ?? [];
    }
}
