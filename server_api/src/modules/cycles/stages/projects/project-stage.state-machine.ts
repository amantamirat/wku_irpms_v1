import { ProjectStageStatus } from "./project-stage.enum";

export class ProjectStageStateMachine {
    private static readonly transitions: Record<ProjectStageStatus, ProjectStageStatus[]> = {
        [ProjectStageStatus.pending]: [ProjectStageStatus.submitted],
        [ProjectStageStatus.submitted]: [ProjectStageStatus.on_review, ProjectStageStatus.pending],
        [ProjectStageStatus.on_review]: [
            ProjectStageStatus.accepted,
            ProjectStageStatus.rejected,
            ProjectStageStatus.submitted
        ],
        [ProjectStageStatus.accepted]: [ProjectStageStatus.on_review],
        [ProjectStageStatus.rejected]: [ProjectStageStatus.on_review]
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
