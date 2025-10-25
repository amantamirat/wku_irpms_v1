import mongoose from 'mongoose';
import { cache } from './cache';
import { User } from '../modules/users/user.model';

/**
 * Checks if a user owns the given organization.
 *
 * @param userId - User ID
 * @param organizationId - Organization ID to check
 * @returns true if user owns the organization, else false
 */
export async function checkOrganizationOwnership(
    userId: string | mongoose.Types.ObjectId,
    organizationId: string | mongoose.Types.ObjectId
): Promise<boolean> {
    const userKey = `user:${userId}:organizations`;

    let orgs = cache.get(userKey) as string[] | undefined; 

    if (!orgs) {
        const user = await User.findById(userId).populate('organizations', '_id');
        if (!user) return false;
        orgs = user.organizations?.map((org: any) => org._id.toString()) ?? [];
        cache.set(userKey, orgs);
    }
    return orgs.length > 0 && orgs.some((orgId) => orgId === organizationId.toString());
}
