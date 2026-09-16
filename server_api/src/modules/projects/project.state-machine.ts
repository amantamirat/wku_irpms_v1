import { ProjectStatus } from "./project.model";

export const PROJECT_TRANSITIONS: Partial<
    Record<ProjectStatus, ProjectStatus[]>
> = {
    [ProjectStatus.draft]: [
        ProjectStatus.approved,
        ProjectStatus.refused,
    ],

    [ProjectStatus.approved]: [
        ProjectStatus.granted,
        ProjectStatus.draft, // Rollback
    ],

    [ProjectStatus.refused]: [
        ProjectStatus.draft, // Rollback
    ],

    [ProjectStatus.granted]: [
        ProjectStatus.completed,
        ProjectStatus.approved, // Rollback
    ],

    [ProjectStatus.completed]: [
        ProjectStatus.granted, // Rollback
    ],
};