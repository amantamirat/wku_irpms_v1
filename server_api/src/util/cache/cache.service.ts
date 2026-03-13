import { IOwnership } from "../../modules/applicants/applicant.model";

import NodeCache from "node-cache";

export const cache = new NodeCache({
    stdTTL: 2 * 3600, // cache for 2 hour
    checkperiod: 3 * 60, // clear expired items every 3 minutes
});


export class CacheService {


    static async getUserOrganizations(userId: string) {
        const userKey = `user:${userId}:organizations`;
        let orgs = cache.get(userKey) as string[] || [];
        /*
        if (!orgs) {
            //console.log(`[Cache MISS] ${userKey}`);
            const user = await User.findById(userId).populate("organizations", "_id");
            if (!user) return [];
            orgs = user.organizations?.map((org: any) => org._id) ?? [];
            this.setUserOrganizations(userId, orgs);
        }
        */
        //console.log(`[Cache HIT] ${userKey}`);
        return orgs;
    }


    static setUserOwnerships(userId: string, ownerships: IOwnership[]) {
        const userKey = `user:${userId}:organizations`;
        cache.set(userKey, ownerships);
    }


    static async getUserPermissions(userId: string) {
        const userKey = `user:${userId}:permissions`;
        let userPermissions = cache.get(userKey) as string[] || [];
        /*
        if (!userPermissions) {
            //note ===>>>> system user can not be find here 
            if (userId === "system") {
                throw new Error("Please Logout and Login Again");
            }
            const user = await User.findById(userId)
                .populate({
                    path: 'roles',
                    populate: { path: 'permissions' }
                });
            if (!user) return [];
            userPermissions = user.roles?.flatMap((role: any) =>
                role.permissions?.map((p: any) => p.name)
            ) || [];
            this.setUserPermissions(userId, userPermissions);
        }
        */
        return userPermissions;
    }

    static setUserPermissions(userId: string, permissions: string[]) {
        const userKey = `user:${userId}:permissions`;
        cache.set(userKey, permissions);
    }


    static async hasOrganizationOwnership(userId: string, organizationId: string): Promise<boolean> {
        const orgs = await this.getUserOrganizations(userId);
        return orgs.map(o => o.toString()).includes(organizationId.toString());
    }


    static async hasPermissions(userId: string, permissions: string[]): Promise<boolean> {
        let userPermissions = await this.getUserPermissions(userId);
        return permissions.some((perm) => userPermissions.includes(perm));
    }

    static async validateOwnership(userId: string, organizationId: string) {
        const ownsOrg = await this.hasOrganizationOwnership(userId, organizationId);
        if (!ownsOrg) {
            throw new Error("User does not have ownership of the organization.");
        }
    }

    static async validatePermission(userId: string, permissions: string[]) {
        const hasPermission = await this.hasPermissions(userId, permissions);
        if (!hasPermission) {
            throw new Error("Permission denied");
        }
    }
}