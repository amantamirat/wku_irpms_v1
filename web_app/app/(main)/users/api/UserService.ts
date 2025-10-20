import { ApiClient } from "@/api/ApiClient";
import { sanitizeUser, User } from "../models/user.model";

const end_point = '/users/';

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

    async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<any> {
        const url = `${end_point}${userId}/change-password`;
        const payload = { oldPassword, newPassword };
        const result = await ApiClient.patch(url, payload);
        return result;
    },

    async resetPassword(userId: string, newPassword: string): Promise<any> {
        const url = `${end_point}${userId}/reset-password`;
        const payload = { newPassword };
        const result = await ApiClient.patch(url, payload);
        return result;
    }

};
