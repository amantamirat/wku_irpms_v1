import { IOwnership } from "../modules/applicants/applicant.model";

import NodeCache from "node-cache";

export const cache = new NodeCache({
    stdTTL: 2 * 3600, // cache for 2 hour
    checkperiod: 3 * 60, // clear expired items every 3 minutes
});


export class CacheService {

    static getUserOrganizations(userId: string): string[] {
        const key = `user:${userId}:organizations`;
        return cache.get<string[]>(key) ?? [];
    }

    static setUserOrganizations(userId: string, orgIds: string[]) {
        const key = `user:${userId}:organizations`;
        cache.set(key, orgIds);
    }

    static getUserPermissions(userId: string): string[] {
        const key = `user:${userId}:permissions`;
        return cache.get<string[]>(key) ?? [];
    }

    static setUserPermissions(userId: string, permissions: string[]) {
        const key = `user:${userId}:permissions`;
        cache.set(key, permissions);
    }

    static hasOrganizationOwnership(userId: string, organizationId: string): boolean {
        const orgs = this.getUserOrganizations(userId);
        return orgs.includes(organizationId);
    }

    static hasPermissions(userId: string, permissions: string[]): boolean {
        const userPermissions = this.getUserPermissions(userId);
        const permSet = new Set(userPermissions);
        return permissions.some(p => permSet.has(p));
    }

    static invalidateUser(userId: string) {
        cache.del(`user:${userId}:permissions`);
        cache.del(`user:${userId}:organizations`);
    }
}