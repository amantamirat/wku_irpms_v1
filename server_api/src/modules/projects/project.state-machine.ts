import { ProjectStatus } from "./project.model";

export const PROJECT_TRANSITIONS: Record<ProjectStatus, ProjectStatus[]> = {
    [ProjectStatus.draft]: [ProjectStatus.submitted],
    [ProjectStatus.submitted]: [ProjectStatus.accepted, ProjectStatus.rejected, ProjectStatus.draft],
    [ProjectStatus.rejected]: [ProjectStatus.submitted],
    [ProjectStatus.accepted]: [ProjectStatus.finalization, ProjectStatus.submitted],
    [ProjectStatus.finalization]: [ProjectStatus.approved, ProjectStatus.accepted],
    [ProjectStatus.approved]: [ProjectStatus.granted, ProjectStatus.finalization],
    [ProjectStatus.granted]: [ProjectStatus.active, ProjectStatus.approved],
    [ProjectStatus.active]: [ProjectStatus.completed, ProjectStatus.granted],
    [ProjectStatus.completed]: [ProjectStatus.active]
};