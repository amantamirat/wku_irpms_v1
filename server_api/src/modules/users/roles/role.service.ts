import { DeleteDto } from "../../../util/delete.dto";
import { CreateRoleDto, UpdateRoleDto } from "./role.dto";
import { IRoleRepository, RoleRepository } from "./role.repository";

export class RoleService {

    private repository: IRoleRepository;

    constructor(repository?: IRoleRepository) {
        this.repository = repository || new RoleRepository();
    }

    async create(dto: CreateRoleDto) {
        const created = await this.repository.create(dto);
        return created;
    }

    async getAll() {
        return await this.repository.findAll();
    }

    async update(dto: UpdateRoleDto) {
        const { id, data } = dto;
        const updated = await this.repository.update(id, data);
        if (!updated) throw new Error("Role not found");
        return updated;
    }

    async delete(dto: DeleteDto) {
        const { id, applicantId: userId } = dto;
        const deleted = await this.repository.delete(id);
        if (!deleted) throw new Error("Role not found");        
        return deleted;
    }
}
