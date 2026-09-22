import { ApiClient } from "@/api/ApiClient";
import { EntityApi } from "@/api/EntityApi";
import {
    FilterUsersOptions,
    User
} from "../models/user.model";
import { sanitize } from "@/utils/utils";

const end_point = "/users";

export const UserApi: EntityApi<
    User,
    FilterUsersOptions | undefined
> & {
    updateRoles: (
        userId: string,
        roles: string[]
    ) => Promise<User>;

    updateScope: (
        userId: string,
        scope: string[] | "*" | null
    ) => Promise<User>;

    getDeleted: (
        options?: FilterUsersOptions
    ) => Promise<User[]>;

    restore: (
        userId: string
    ) => Promise<User>;
} = {

    async create(user: Partial<User>): Promise<User> {
        const sanitized = sanitize(user);

        const response =
            await ApiClient.post(
                end_point,
                sanitized
            );

        return response as User;
    },

    async getAll(
        options?: FilterUsersOptions
    ): Promise<User[]> {

        const response =
            await ApiClient.get(
                end_point,
                options
            );

        return response as User[];
    },

    async lookup(
        options?: FilterUsersOptions
    ): Promise<User[]> {

        const response =
            await ApiClient.get(
                `${end_point}/lookup`,
                options
            );

        return response as User[];
    },

    async getDeleted(
        options?: FilterUsersOptions
    ): Promise<User[]> {

        const response =
            await ApiClient.get(
                `${end_point}/deleted`,
                options
            );

        return response as User[];
    },

    async update(
        user: Partial<User>
    ): Promise<User> {

        if (!user._id) {
            throw new Error("_id required");
        }

        const sanitized = sanitize(user);

        const response =
            await ApiClient.put(
                `${end_point}/${user._id}`,
                sanitized
            );

        return response as User;
    },

    async updateRoles(
        userId: string,
        roles: string[]
    ): Promise<User> {

        if (!userId) {
            throw new Error(
                "User ID is required for updating roles."
            );
        }

        const response =
            await ApiClient.put(
                `${end_point}/${userId}/roles`,
                { roles }
            );

        return response as User;
    },

    async updateScope(
        userId: string,
        scope: string[] | "*" | null
    ): Promise<User> {

        if (!userId) {
            throw new Error(
                "User ID is required for updating scope."
            );
        }

        const response =
            await ApiClient.put(
                `${end_point}/${userId}/scope`,
                { scope }
            );

        return response as User;
    },

    async restore(
        userId: string
    ): Promise<User> {

        if (!userId) {
            throw new Error(
                "User ID is required for restoring user."
            );
        }

        const response =
            await ApiClient.patch(
                `${end_point}/${userId}/restore`
            );

        return response as User;
    },

    async delete(
        user: Partial<User>
    ): Promise<boolean> {

        if (!user._id) {
            throw new Error("_id required");
        }

        return ApiClient.delete(
            `${end_point}/${user._id}`
        );
    }
};