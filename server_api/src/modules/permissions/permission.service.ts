
import { IPermissionRepository, PermissionRepository } from "./permission.repository";

export class PermissionService {

    private repository: IPermissionRepository;

    constructor(repository: IPermissionRepository) {
        this.repository = repository;
    }

    async getPermissions() {
        return await this.repository.findAll();
    }

    
}
