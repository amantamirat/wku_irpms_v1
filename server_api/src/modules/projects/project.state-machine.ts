import { ProjectStatus } from "./project.enum";

// project.state-machine.ts
export class ProjectStateMachine {
    private static readonly transitions: Record<ProjectStatus, ProjectStatus[]> = {
        [ProjectStatus.pending]: [ProjectStatus.submitted],
        [ProjectStatus.submitted]: [ProjectStatus.pending]
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