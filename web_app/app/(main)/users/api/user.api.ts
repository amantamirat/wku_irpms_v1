import { ApiClient } from "@/api/ApiClient";
import { EntityApi } from "@/api/EntityApi";
import { FilterUsersOptions, IOwnership, User } from "../models/user.model";
import { sanitize } from "@/utils/sanitizer";

const end_point = "/users";


export const UserApi: EntityApi<User, FilterUsersOptions | undefined> & {

    updateRoles: (userId: string, roles: string[]) => Promise<User>;
    updateOwnerships: (userId: string, ownerships: IOwnership[]) => Promise<User>;
    // Add other custom function signatures here
} = {

    async create(user: Partial<User>): Promise<User> {
        const sanitized = sanitize(user);
        const created = await ApiClient.post(end_point, sanitized);
        return created as User;
    },

    async getAll(options?: FilterUsersOptions): Promise<User[]> {
        const data = await ApiClient.get(end_point, options);
        return data as User[];
    },


    async lookup(options?: FilterUsersOptions) {
        return ApiClient.get(`${end_point}/lookup`, options);
    },

    async update(user: Partial<User>): Promise<User> {
        if (!user._id) throw new Error("_id required");
        const sanitized = sanitize(user);
        const updated = await ApiClient.put(`${end_point}/${user._id}`, sanitized);
        return updated as User;
    },

    /**
  * Updates the roles assigned to a specific user.
  * @param userId - The unique identifier of the user.
  * @param roles - An array of role keys or IDs to assign.
  */
    async updateRoles(userId: string, roles: string[]): Promise<User> {
        if (!userId) throw new Error("User ID is required for updating roles.");
        try {
            const url = `${end_point}/${userId}/roles`;
            const response = await ApiClient.put(url, { roles: roles });
            return response as User;
        } catch (error: any) {
            console.error(`[UserApi] Failed to update roles for user ${userId}:`, error);
            throw error;
        }
    },

    /**
 * Updates the ownerships assigned to a specific user.
 * @param userId - The unique identifier of the user.
 * @param ownerships - An array of ownership objects to assign.
 */
    async updateOwnerships(userId: string, ownerships: IOwnership[]): Promise<User> {
        if (!userId) throw new Error("User ID is required for updating ownerships.");

        try {
            const url = `${end_point}/${userId}/ownerships`;
            const response = await ApiClient.put(url, { ownerships });
            return response as User;
        } catch (error: any) {
            console.error(`[UserApi] Failed to update ownerships for user ${userId}:`, error);
            throw error;
        }
    },

    async delete(user: Partial<User>): Promise<boolean> {
        if (!user._id) throw new Error("_id required");
        return ApiClient.delete(`${end_point}/${user._id}`);
    },
};