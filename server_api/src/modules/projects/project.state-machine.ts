import { ProjectStatus } from "./project.model";


export const PROJECT_TRANSITIONS: Partial<Record<ProjectStatus, ProjectStatus[]>> = {
    [ProjectStatus.draft]: [
        ProjectStatus.approved,
        ProjectStatus.refused
    ],
    [ProjectStatus.approved]: [
        ProjectStatus.granted,
        ProjectStatus.draft // Rollback
    ],
    [ProjectStatus.refused]: [
        ProjectStatus.draft // Rollback
    ],
    [ProjectStatus.granted]: [
        ProjectStatus.active,
        ProjectStatus.approved // Rollback
    ],
    [ProjectStatus.active]: [
        ProjectStatus.completed,
        ProjectStatus.terminated,
        ProjectStatus.granted // Rollback
    ],
    [ProjectStatus.completed]: [
        ProjectStatus.active
    ],
    [ProjectStatus.terminated]: [
        ProjectStatus.active
    ]
};

