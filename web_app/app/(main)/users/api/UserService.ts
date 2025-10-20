import { ApiClient } from "@/api/ApiClient";
import { PasswordType, sanitizeUser, User } from "../models/user.model";

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

    async changePassword(password: Partial<PasswordType>): Promise<any> {
        const url = `${end_point}${password._id}/change-password`;        
        const result = await ApiClient.patch(url, password);
        return result;
    },

    async resetPassword(password: Partial<PasswordType>): Promise<any> {
        const url = `${end_point}${password._id}/reset-password`;
        const result = await ApiClient.patch(url, password);
        return result;
    }

};
