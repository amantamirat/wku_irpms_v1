import { ProjectStatus } from "./project.model";

export const PROJECT_TRANSITIONS: Record<ProjectStatus, ProjectStatus[]> = {
    [ProjectStatus.draft]: [
        ProjectStatus.submitted
    ],

    [ProjectStatus.submitted]: [
        ProjectStatus.accepted,
        ProjectStatus.rejected,
        ProjectStatus.draft
    ],

    [ProjectStatus.rejected]: [
        ProjectStatus.submitted
    ],

    [ProjectStatus.accepted]: [
        ProjectStatus.granted,
        ProjectStatus.refused,
        ProjectStatus.submitted
    ],

    [ProjectStatus.granted]: [
        ProjectStatus.active,
        ProjectStatus.accepted
    ],

    [ProjectStatus.refused]: [
        ProjectStatus.accepted
    ],

    [ProjectStatus.active]: [
        ProjectStatus.completed,
        ProjectStatus.terminated,
        ProjectStatus.granted
    ],

    [ProjectStatus.completed]: [
        ProjectStatus.active
    ],

    [ProjectStatus.terminated]: [
        ProjectStatus.active
    ]
};