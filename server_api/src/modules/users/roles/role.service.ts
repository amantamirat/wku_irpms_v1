import { Types } from "mongoose";
import { Role } from "./role.model";

export interface CreateRoleDto {
    role_name: string;
    permissions: Types.ObjectId[];
}


export class RoleService {

    static async createRole(data: CreateRoleDto) {
        const createdRole = await Role.create({ ...data });
        return createdRole;
    }

    static async getRoles() {
        return Role.find().lean();
    }

    static async updateRole(id: string, data: Partial<CreateRoleDto>) {
        const role = await Role.findById(id);
        if (!role) throw new Error("Role not found");
        Object.assign(role, data);
        return role.save();
    }

    static async deleteRole(id: string) {
        const role = await Role.findById(id);
        if (!role) throw new Error("Role not found");
        return await role.deleteOne();
    }
}
