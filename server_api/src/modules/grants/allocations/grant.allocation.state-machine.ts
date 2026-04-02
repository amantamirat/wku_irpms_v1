export enum AllocationStatus {
    planned = 'planned',
    active = 'active',
    closed = "closed"
}

export const ALLOCATION_TRANSITIONS: Record<AllocationStatus, AllocationStatus[]> = {
    [AllocationStatus.planned]: [AllocationStatus.active],
    [AllocationStatus.active]: [AllocationStatus.closed, AllocationStatus.planned],
    [AllocationStatus.closed]: [AllocationStatus.active]
};