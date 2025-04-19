import { User } from "@/models/user";
import { MyService } from "./MyService";

const get_endpoint = '/users/';
const create_endpoint = '/users/create';
const update_endpoint = '/users/update';
const delete_endpoint = '/users/delete';


export const UserService = {

    async getUsers(): Promise<User[]> {
        const data = await MyService.get(get_endpoint);
        return data as User[];
    },

    async createUser(user: Partial<User>): Promise<User> {
        const createdData = await MyService.post(create_endpoint, user);
        return createdData as User;
    },

    async updateUser(user: Partial<User>): Promise<User> {
        if (!user._id) {
            throw new Error("_id required.");
        }
        const updatedUser = await MyService.put(update_endpoint, user);
        return updatedUser as User;
    },

    async deleteUser(user: User): Promise<boolean> {
        if (!user._id) {
            throw new Error("_id required.");
        }
        const response = await MyService.delete(delete_endpoint);
        return response;
    },
};
