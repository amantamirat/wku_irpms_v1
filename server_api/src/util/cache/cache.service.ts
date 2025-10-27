import mongoose from "mongoose";
import { User } from "../../modules/users/user.model";
import { cache } from "./cache";

export class CacheService {

    static async getUserOrganizations(userId: string) {
        const userKey = `user:${userId}:organizations`;
        let orgs = cache.get(userKey) as string[] | undefined;
        if (!orgs) {
            const user = await User.findById(userId).populate("organizations", "_id");
            if (!user) return [];
            orgs = user.organizations?.map((org: any) => org._id.toString()) ?? [];
            this.setUserOrganizations(userId, orgs);
        }
        return orgs;
    }

    static setUserOrganizations(userId: string, organizations: string[]) {
        const userKey = `user:${userId}:organizations`;
        cache.set(userKey, organizations);
    }

    static async getUserPermissions(userId: string) {
        const userKey = `user:${userId}:permissions`;
        let userPermissions = cache.get(userKey) as string[] | undefined;
        if (!userPermissions) {
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
        return userPermissions;
    }

    static setUserPermissions(userId: string, permissions: string[]) {
        const userKey = `user:${userId}:permissions`;
        cache.set(userKey, permissions);
    }

    static async hasOrganizationOwnership(userId: string, organizationId: string | mongoose.Types.ObjectId): Promise<boolean> {
        const orgs = await this.getUserOrganizations(userId);
        console.log(orgs);
        return orgs.includes(organizationId.toString());
    }

    static async hasPermissions(userId: string, permissions: string[]): Promise<boolean> {
        let userPermissions = await this.getUserPermissions(userId);
        return permissions.some((perm) => userPermissions.includes(perm));
    }

    static async validateOwnership(userId: string, organizationId: string | mongoose.Types.ObjectId) {
        const ownsOrg = await this.hasOrganizationOwnership(userId, organizationId);
        if (!ownsOrg) {
            throw new Error("You are not authorized to manipulate data under this organization.");
        }
    }
}