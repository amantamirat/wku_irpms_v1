import { GrantStatus } from "./grant.model";

export const GRANT_TRANSITIONS: Record<GrantStatus, GrantStatus[]> = {
    [GrantStatus.planned]: [GrantStatus.active],
    [GrantStatus.active]: [GrantStatus.closed, GrantStatus.planned],
    [GrantStatus.closed]: [GrantStatus.active]
};