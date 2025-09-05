import { Permission } from "./permission.model";
import fs from 'fs/promises';
import path from 'path';

export class PermissionService {

    static async initPermissions() {
        const filePath = path.join(process.cwd(), 'data', 'permissions.json');
        const rawData = await fs.readFile(filePath, 'utf-8');
        const permissions = JSON.parse(rawData);
        for (const perm of permissions) {
            const exists = await Permission.findOne({ name: perm.name });
            if (!exists) {
                await new Permission(perm).save();
            }
        }
        console.log('Permissions seeded from JSON');
    };

    static async getPermissions() {
        return Permission.find().lean();
    }
}