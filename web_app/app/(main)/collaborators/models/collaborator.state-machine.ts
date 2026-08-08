import { CollaboratorStatus } from "./collaborator.model";


export const COLLAB_STATUS_ORDER: CollaboratorStatus[] = [
    CollaboratorStatus.pending,
    CollaboratorStatus.verified
];

export const COLLAB_TRANSITIONS: Record<CollaboratorStatus, CollaboratorStatus[]> = {
    [CollaboratorStatus.pending]: [CollaboratorStatus.verified],
    [CollaboratorStatus.verified]: [CollaboratorStatus.pending]
};