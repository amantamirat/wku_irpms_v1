import fs from 'fs/promises';
import path from 'path';
import { IPermissionRepository, PermissionRepository } from "./permission.repository";

export class PermissionService {

    private repository: IPermissionRepository;

    constructor(repository?: IPermissionRepository) {
        this.repository = repository || new PermissionRepository();
    }

    async getPermissions() {
        return await this.repository.findAll();
    }

    static async seedPermissions() {
        const repository = new PermissionRepository();
        const filePath = path.join(process.cwd(), 'data', 'permissions.json');
        const rawData = await fs.readFile(filePath, 'utf-8');
        const permissions = JSON.parse(rawData);
        let seeded = false;
        for (const perm of permissions) {
            const exists = await repository.findByName(perm.name);
            if (!exists) {
                await repository.create(perm);
                //new Permission(perm).save();
                seeded = true;
            }
        }
        if (seeded)
            console.log('Permissions seeded from JSON');
    };


}