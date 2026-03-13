import { ApiClient } from "@/api/ApiClient";
import { sanitizeUser, User, UserStatus } from "../models/user.model";
import { EntityApi } from "@/api/EntityApi";
import { TransitionRequestDto } from "@/types/util";

const end_point = '/users';


export const UserApi: EntityApi<User> = {

    async create(user: Partial<User>): Promise<User> {
        const sanitized = sanitizeUser(user);
        const created = await ApiClient.post(end_point, sanitized);
        return created as User;
    },

    async getAll(): Promise<User[]> {
        const data = await ApiClient.get(end_point);
        return data as User[];
    },

    async update(user: Partial<User>) {
        if (!user._id) throw new Error("_id required")
        const sanitized = sanitizeUser(user);
        return ApiClient.put(`${end_point}/${user._id}`, sanitized)
    },

    async transitionState(id: string, dto: TransitionRequestDto): Promise<any> {
        const query = new URLSearchParams();
        query.append("id", id);
        const url = `${end_point}/${id}`;
        const updated = await ApiClient.patch(url, dto);
        return updated;
    },

    async delete(user) {
        if (!user._id) throw new Error("_id required")
        return ApiClient.delete(`${end_point}/${user._id}`)
    }


    /*
        async changePassword(password: Partial<User>): Promise<any> {
            const result = await ApiClient.patch(change_password_end_point, password);
            return result;
        },
    
    */



};
