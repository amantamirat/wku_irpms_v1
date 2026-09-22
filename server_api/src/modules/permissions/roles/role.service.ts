import { DeleteDto } from "../../../common/dtos/delete.dto";
import { AppError } from "../../../common/errors/app.error";
import { ERROR_CODES } from "../../../common/errors/error.codes";
import { IUserRepository, UserRepository } from "../../users/user.repository";
import { CreateRoleDto, UpdateRoleDto } from "./role.dto";
import { RoleRepository } from "./role.repository";

export class RoleService {

    constructor(
        private readonly repository: RoleRepository,
        private readonly userRepo: IUserRepository,
    ) {
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
        if (!updated) throw new AppError(ERROR_CODES.ROLE_NOT_FOUND);
        return updated;
    }

    async delete(dto: DeleteDto) {
        const { id } = dto;
        const exist = await this.userRepo.exists({ role: id });
        if (exist) throw new AppError(ERROR_CODES.ROLE_IN_USE);
        const deleted = await this.repository.delete(id);
        if (!deleted) throw new Error(ERROR_CODES.ROLE_NOT_FOUND);
        return deleted;
    }

}
