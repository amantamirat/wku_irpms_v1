import { ApiClient } from "@/api/ApiClient";
import { EntityApi } from "@/api/EntityApi";
import { GetUsersOptions, User, sanitizeUser } from "../models/user.model";

const end_point = "/users";


export const UserApi: EntityApi<User, GetUsersOptions | undefined> & {

    updateRoles: (userId: string, roles: string[]) => Promise<User>;
    // Add other custom function signatures here
} = {

    async create(user: Partial<User>): Promise<User> {
        const sanitized = sanitizeUser(user);
        const created = await ApiClient.post(end_point, sanitized);
        return created as User;
    },

    async getAll(options?: GetUsersOptions): Promise<User[]> {
        const query = new URLSearchParams();
        if (options) {
            if (options.populate !== undefined) {
                query.append("populate", String(options.populate));
            }
        }
        const qs = query.toString();
        const url = `${end_point}${qs ? `?${qs}` : ""}`;
        const data = await ApiClient.get(url);
        return data as User[];
    },

    async update(user: Partial<User>): Promise<User> {
        if (!user._id) throw new Error("_id required");

        const sanitized = sanitizeUser(user);
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

    async delete(user: Partial<User>): Promise<boolean> {
        if (!user._id) throw new Error("_id required");

        return ApiClient.delete(`${end_point}/${user._id}`);
    },
};