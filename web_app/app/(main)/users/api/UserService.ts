import { ApiClient } from "@/api/ApiClient";
import { User } from "../models/user.model";
import { Role } from "../../roles/models/role.model";

const end_point = '/users/';

function sanitizeUser(user: Partial<User>): Partial<User> {
    return {
        ...user,
        roles: user.roles
            ?.map((role) =>
                typeof role === "object" && role !== null
                    ? (role as Role)._id
                    : role
            )
            .filter((r): r is string => typeof r === "string"),
    };
}

export const UserApi = {

    async getUsers(): Promise<User[]> {
        const data = await ApiClient.get(end_point);
        return data as User[];
    },

    async createUser(user: Partial<User>): Promise<User> {
        const sanitized = sanitizeUser(user);
        const createdData = await ApiClient.post(end_point, sanitized);
        return createdData as User;
    },

    async updateUser(user: Partial<User>): Promise<User> {
        if (!user._id) {
            throw new Error("_id required.");
        }
        const url = `${end_point}${user._id}`;
        const sanitized = sanitizeUser(user);
        const updatedUser = await ApiClient.put(url, sanitized);
        return updatedUser as User;
    },

    async deleteUser(user: User): Promise<boolean> {
        if (!user._id) {
            throw new Error("_id required.");
        }
        const url = `${end_point}${user._id}`;
        const response = await ApiClient.delete(url);
        return response;
    },

    async linkUser(user: Partial<User>): Promise<User> {
        if (!user._id) {
            throw new Error("_id required.");
        }
        const url = `${end_point}${user._id}`;
        const updatedUser = await ApiClient.post(url, user);
        return updatedUser as User;
    },

};
