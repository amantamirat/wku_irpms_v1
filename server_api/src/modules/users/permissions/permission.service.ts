import fs from 'fs/promises';
import path from 'path';
import { IPermissionRepository, PermissionRepository } from "./permission.repository";

export class PermissionService {

    private repository: IPermissionRepository;

    constructor(repository?: IPermissionRepository) {
        this.repository = repository || new PermissionRepository();        
        
        (async () => {
            await this.seedPermissions();
        })();

    }


    async getPermissions() {
        return await this.repository.findAll();
    }

    async seedPermissions() {
        const filePath = path.join(process.cwd(), 'data', 'permissions.json');
        const rawData = await fs.readFile(filePath, 'utf-8');
        const permissions = JSON.parse(rawData);

        let seeded = false;

        for (const perm of permissions) {
            const exists = await this.repository.findByName(perm.name);
            if (!exists) {
                await this.repository.create(perm);
                seeded = true;
            }
        }
        if (seeded) console.log('Permissions seeded from JSON');
    }
}
