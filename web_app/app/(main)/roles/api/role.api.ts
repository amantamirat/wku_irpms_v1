import { ApiClient } from "@/api/ApiClient";
import { Role } from "../models/role.model";


const end_point = '/roles/';


export const RoleApi = {

    async getRoles(): Promise<Role[]> {
        const data = await ApiClient.get(end_point);
        return data as Role[];
    },

    async createRole(role: Partial<Role>): Promise<Role> {
        const createdData = await ApiClient.post(end_point, role);
        return createdData as Role;
    },

    async updateRole(role: Partial<Role>): Promise<Role> {
        if (!role._id) {
            throw new Error("_id required.");
        }
        const url = `${end_point}${role._id}`;
        const updatedRole = await ApiClient.put(url, role);
        return updatedRole as Role;
    },

    async deleteRole(role: Role): Promise<boolean> {
        if (!role._id) {
            throw new Error("_id required.");
        }
        const url = `${end_point}${role._id}`;
        const response = await ApiClient.delete(url);
        return response;
    },
};
