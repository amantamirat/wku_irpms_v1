import { Role } from "./role.model";
import { User } from "../user.model";
import { Permission } from "../permissions/permission.model";
import { CreateRoleDto, UpdateRoleDto } from "./role.dto";
import { IRoleRepository, RoleRepository } from "./role.repository";
import { DeleteDto } from "../../../util/delete.dto";



export class RoleService {

    private repository: IRoleRepository;

    constructor(repository?: IRoleRepository) {
        this.repository = repository || new RoleRepository();
    }

    async create(dto: CreateRoleDto) {
        const createdRole = await this.repository.create(dto);
        return createdRole;
    }

    async getAll() {
        return await this.repository.findAll();
    }

    async update(dto: UpdateRoleDto) {
        const { id, data } = dto;
        const role = this.repository.update(id, data);
        if (!role) throw new Error("Role not found");
        return role;
    }

    async delete(dto: DeleteDto) {
        const { id, userId } = dto;
        const role = await this.repository.delete(id);
        if (!role) throw new Error("Role not found");
        //const isAssigned = await User.exists({ roles: id });
        //if (isAssigned) {
        //throw new Error("Cannot delete role: it is assigned to one or more users");
        // }
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
