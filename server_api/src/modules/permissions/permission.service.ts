
import { AppError } from "../../common/errors/app.error";
import { ERROR_CODES } from "../../common/errors/error.codes";
import { UpdatePermissionDto } from "./permission.dto";
import { IPermissionRepository, PermissionRepository } from "./permission.repository";

export class PermissionService {

    private repository: IPermissionRepository;

    constructor(repository: IPermissionRepository) {
        this.repository = repository;
    }

    async getPermissions() {
        return await this.repository.findAll();
    }

    async update(dto: UpdatePermissionDto) {
        const { id, data } = dto;
        const permDoc = await this.repository.update(id, data);
        if (!permDoc)
            throw new AppError(ERROR_CODES.PERMISSION_NOT_FOUND);
        return permDoc;
    }

    async delete(id: string) {
        const permDoc = await this.repository.delete(id);
        if (!permDoc)
            throw new AppError(ERROR_CODES.PERMISSION_NOT_FOUND);
        return permDoc;
    }


}
