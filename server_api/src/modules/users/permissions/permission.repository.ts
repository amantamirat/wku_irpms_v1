import { IPermission, Permission } from "./permission.model";

export interface IPermissionRepository {
    findOne(name: string): Promise<IPermission | null>;
    findAll(): Promise<Partial<IPermission>[]>;
}

export class PermissionRepository implements IPermissionRepository {
    
    async findOne(name: string): Promise<IPermission | null> {
        return Permission.findOne({ name: name });
    }
    async findAll() {
        const filter: any = {};
        return Permission.find(filter)
            .lean<IPermission[]>()
            .exec();
    }
}
