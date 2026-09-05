import { IOwnership } from "../modules/users/user.model";
import NodeCache from "node-cache";

export const cache = new NodeCache({
    stdTTL: 2 * 3600,
    checkperiod: 3 * 60,
});

export class CacheService {

    private static userOrganizationsKey(userId: string): string {
        return `user:${userId}:organizations`;
    }

    private static userPermissionsKey(userId: string): string {
        return `user:${userId}:permissions`;
    }

    static getUserOrganizations(userId: string): string[] | undefined {
        return cache.get<string[]>(this.userOrganizationsKey(userId));
    }

    static setUserOrganizations(userId: string, orgIds: string[]): void {
        cache.set(this.userOrganizationsKey(userId), orgIds);
    }

    static getUserPermissions(userId: string): string[] | undefined {
        return cache.get<string[]>(this.userPermissionsKey(userId));
    }

    static setUserPermissions(userId: string, permissions: string[]): void {
        cache.set(this.userPermissionsKey(userId), permissions);
    }

    static hasOrganizationOwnership(userId: string, organizationId: string): boolean {
        const orgs = this.getUserOrganizations(userId);
        return orgs ? orgs.includes(organizationId) : false;
    }

    /*

    static hasPermissions(userId: string, permissions: string[]): boolean {
        const userPermissions = this.getUserPermissions(userId);

        if (!userPermissions) {
            return false;
        }
        const permSet = new Set(userPermissions);
        return permissions.some(permission => permSet.has(permission));
    }
        */

    static invalidateUser(userId: string): void {
        cache.del(this.userPermissionsKey(userId));
        cache.del(this.userOrganizationsKey(userId));
    }
}