import { ProjectStageStatus } from "./project-stage.enum";

export class ProjectStageStateMachine {
    private static readonly transitions: Record<ProjectStageStatus, ProjectStageStatus[]> = {
        [ProjectStageStatus.pending]: [ProjectStageStatus.submitted],
        [ProjectStageStatus.submitted]: [ProjectStageStatus.on_review, ProjectStageStatus.pending],
        [ProjectStageStatus.on_review]: [ProjectStageStatus.reviewed, ProjectStageStatus.submitted],
        [ProjectStageStatus.reviewed]: [ProjectStageStatus.accepted, ProjectStageStatus.rejected, ProjectStageStatus.on_review],
        [ProjectStageStatus.accepted]: [ProjectStageStatus.reviewed],
        [ProjectStageStatus.rejected]: [ProjectStageStatus.reviewed]
    };

    static canTransition(from: ProjectStageStatus, to: ProjectStageStatus): boolean {
        return this.transitions[from]?.includes(to) ?? false;
    }

    static validateTransition(from: ProjectStageStatus, to: ProjectStageStatus): void {
        if (!this.canTransition(from, to)) {
            throw new Error(`Invalid stage transition: ${from} → ${to}`);
        }
    }

    static getAllowedTransitions(from: ProjectStageStatus): ProjectStageStatus[] {
        return this.transitions[from] ?? [];
    }
}
