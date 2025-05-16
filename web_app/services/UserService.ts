import { User } from "@/models/user";
import { MyService } from "./MyService";
import { Role } from "@/models/role";

const end_point = '/users/';



export const UserService = {

    async getUsers(): Promise<User[]> {
        const data = await MyService.get(end_point);
        return data as User[];
    },

    async createUser(user: Partial<User>): Promise<User> {
        const createdData = await MyService.post(end_point, user);
        return createdData as User;
    },

    async addRole(user: User, role: Partial<Role>): Promise<User> {
        const url = `${end_point}${user._id}/role`;
        const createdData = await MyService.post(url, { role: role });
        return createdData as User;
    },

    async updateUser(user: Partial<User>): Promise<User> {
        if (!user._id) {
            throw new Error("_id required.");
        }
        const url = `${end_point}${user._id}`;
        const updatedUser = await MyService.put(url, user);
        return updatedUser as User;
    },

    async deleteUser(user: User): Promise<boolean> {
        if (!user._id) {
            throw new Error("_id required.");
        }
        const url = `${end_point}${user._id}`;
        const response = await MyService.delete(url);
        return response;
    },

    async removeRole(user: User, role: Role): Promise<boolean> {
        if (!user._id || !role._id) {
            throw new Error("_id required.");
        }
        const url = `${end_point}${user._id}/role/${role._id}`;
        const response = await MyService.delete(url);
        return response;
    },
};
