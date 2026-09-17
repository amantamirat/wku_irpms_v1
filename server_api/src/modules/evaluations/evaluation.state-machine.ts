export enum ResourceStatus {
    draft = 'draft',
    published = 'published',
    archived = 'archived'
}

export const RESOURCE_TRANSITIONS: Record<ResourceStatus, ResourceStatus[]> = {
    [ResourceStatus.draft]: [ResourceStatus.published],
    [ResourceStatus.published]: [ResourceStatus.archived, ResourceStatus.draft],
    [ResourceStatus.archived]: [ResourceStatus.published]
};