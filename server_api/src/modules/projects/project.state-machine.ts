import { ProjectStatus } from "./project.status";

// project.state-machine.ts
export class ProjectStateMachine {

    private static readonly transitions: Record<ProjectStatus, ProjectStatus[]> = {
        [ProjectStatus.pending]: [ProjectStatus.submitted],
        [ProjectStatus.submitted]: [ProjectStatus.rejected, ProjectStatus.accepted, ProjectStatus.pending],
        [ProjectStatus.rejected]: [ProjectStatus.submitted],
        [ProjectStatus.accepted]: [ProjectStatus.negotiation, ProjectStatus.submitted],
        [ProjectStatus.negotiation]: [ProjectStatus.approved, ProjectStatus.accepted],
        [ProjectStatus.approved]: [ProjectStatus.granted, ProjectStatus.negotiation],
        [ProjectStatus.granted]: [ProjectStatus.approved]
    };

    static canTransition(from: ProjectStatus, to: ProjectStatus): boolean {
        return this.transitions[from]?.includes(to) ?? false;
    }

    static validateTransition(from: ProjectStatus, to: ProjectStatus): void {
        if (!this.canTransition(from, to)) {
            throw new Error(`Invalid state transition: ${from} → ${to}`);
        }
    }

    static getAllowedTransitions(from: ProjectStatus): ProjectStatus[] {
        return this.transitions[from] ?? [];
    }
}