import { ProjectDocStatus } from "./document.enum";

export class DocumentStateMachine {
    private static readonly transitions: Record<ProjectDocStatus, ProjectDocStatus[]> = {
        [ProjectDocStatus.pending]: [ProjectDocStatus.submitted],
        [ProjectDocStatus.submitted]: [ProjectDocStatus.reviewed, 
            ProjectDocStatus.pending],
        //[ProjectDocStatus.on_review]: [ProjectDocStatus.reviewed, ProjectDocStatus.submitted],
        [ProjectDocStatus.reviewed]: [ProjectDocStatus.accepted, ProjectDocStatus.rejected, ProjectDocStatus.submitted],
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
