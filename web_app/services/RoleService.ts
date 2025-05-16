import { Role } from "@/models/role";
import { MyService } from "./MyService";

const end_point = '/roles/';


export const RoleService = {

    async getRoles(): Promise<Role[]> {
        const data = await MyService.get(end_point);
        return data as Role[];
    },

    async createRole(role: Partial<Role>): Promise<Role> {
        const createdData = await MyService.post(end_point, role);
        return createdData as Role;
    },

    async updateRole(role: Partial<Role>): Promise<Role> {
        if (!role._id) {
            throw new Error("_id required.");
        }
        const url = `${end_point}${role._id}`;
        const updatedRole = await MyService.put(url, role);
        return updatedRole as Role;
    },

    async deleteRole(role: Role): Promise<boolean> {
        if (!role._id) {
            throw new Error("_id required.");
        }
        const url = `${end_point}${role._id}`;
        const response = await MyService.delete(url);
        return response;
    },
};
