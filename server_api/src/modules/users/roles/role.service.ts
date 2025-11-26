import { Types } from "mongoose";
import { Role } from "./role.model";
import { User } from "../user.model";
import { Permission } from "../permissions/permission.model";

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
        return Role.find().populate("permissions").lean();
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


    static async initAdminRole() {
        const roleName = "admin";

        // find role if exists
        let adminRole = await Role.findOne({ role_name: roleName });
        if (!adminRole) {
            // permissions to add
            const permissionNames = [
                "permission:read",
                "user:create", "user:read", "user:update", "user:delete", "user:reset",
                "role:create", "role:read", "role:update", "role:delete"
            ];

            const permissions = await Permission.find({ name: { $in: permissionNames } });

            if (!permissions.length) {
                throw new Error("Permissions not found. Did you seed permissions?");
            }


            // create admin role
            adminRole = await Role.create({
                role_name: roleName,
                permissions: permissions.map(p => p._id)
            });

            console.log("Admin role created with permissions.");
        }
        return adminRole;
    }
}
