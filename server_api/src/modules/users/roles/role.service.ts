import { DeleteDto } from "../../../util/delete.dto";
import { PermissionRepository } from "../permissions/permission.repository";
import { CreateRoleDto, UpdateRoleDto } from "./role.dto";
import { IRoleRepository, RoleRepository } from "./role.repository";



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
        const role = await this.repository.update(id, data);
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

    /*
    static async initAdminRole() {
        const roleRepository = new RoleRepository();
        const permReposiroty = new PermissionRepository();
        const roleName = "admin";
        // find role if exists
        let adminRole = await roleRepository.findByName(roleName);
        if (!adminRole) {
            // permissions to add
            const permissionNames = [
                "permission:read",
                "user:create", "user:read", "user:update", "user:delete", "user:reset",
                "role:create", "role:read", "role:update", "role:delete"
            ];

            const permissions = await permReposiroty.findByNames(permissionNames);

            if (!permissions.length) {
                throw new Error("Permissions not found. Did you seed permissions?");
            }
            // create admin role
            adminRole = await roleRepository.create({
                name: roleName,
                permissions: permissions.map(p => String(p._id))
            });

            console.log("Admin role created with permissions.");
        }
        return adminRole;
    }
        */
}
