import { Types } from "mongoose";
import { Role } from "./role.model";
import { User } from "../user.model";

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
        const isAssigned = await User.exists({ roles: id });
        if (isAssigned) {
            throw new Error("Cannot delete role: it is assigned to one or more users");
        }
        return await role.deleteOne();
    }
}
