import { ApiClient } from "@/api/ApiClient";
import { User } from "../models/user.model";

const end_point = '/users/';

export const UserApi = {

    async getUsers(): Promise<User[]> {
        const data = await ApiClient.get(end_point);
        return data as User[];
    },

    async createUser(user: Partial<User>): Promise<User> {
        const createdData = await ApiClient.post(end_point, user);
        return createdData as User;
    },

    async updateUser(user: Partial<User>): Promise<User> {
        if (!user._id) {
            throw new Error("_id required.");
        }
        const url = `${end_point}${user._id}`;
        const updatedUser = await ApiClient.put(url, user);
        return updatedUser as User;
    },

    async deleteUser(user: User): Promise<boolean> {
        if (!user._id) {
            throw new Error("_id required.");
        }
        const url = `${end_point}${user._id}`;
        const response = await ApiClient.delete(url);
        return response;
    }
    
};
