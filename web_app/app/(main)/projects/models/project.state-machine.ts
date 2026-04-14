import { ProjectStatus } from "./project.model";

export const PROJECT_STATUS_ORDER: ProjectStatus[] = [
    ProjectStatus.draft,
    ProjectStatus.submitted,
    ProjectStatus.accepted,
    ProjectStatus.negotiation,
    ProjectStatus.approved,
    ProjectStatus.granted,
    ProjectStatus.completed,
    ProjectStatus.rejected
];

export const PROJECT_TRANSITIONS: Record<ProjectStatus, ProjectStatus[]> = {
    [ProjectStatus.draft]: [ProjectStatus.submitted],
    //[ProjectStatus.submitted]: [ProjectStatus.rejected, ProjectStatus.accepted, ProjectStatus.draft],
    [ProjectStatus.submitted]: [ProjectStatus.draft],    
    //[ProjectStatus.rejected]: [ProjectStatus.submitted],
    [ProjectStatus.rejected]: [],
    //[ProjectStatus.accepted]: [ProjectStatus.negotiation, ProjectStatus.submitted],
    [ProjectStatus.accepted]: [ProjectStatus.negotiation],
    [ProjectStatus.negotiation]: [ProjectStatus.approved, ProjectStatus.accepted],
    [ProjectStatus.approved]: [ProjectStatus.granted, ProjectStatus.negotiation],
    [ProjectStatus.granted]: [ProjectStatus.completed, ProjectStatus.approved],
    [ProjectStatus.completed]: [ProjectStatus.granted]
};