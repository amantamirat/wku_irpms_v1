import { IPermission, Permission } from "./permission.model";

export interface IPermissionRepository {
    create(data: any): Promise<IPermission>;
    findOne(name: string): Promise<IPermission | null>;
    findAll(): Promise<Partial<IPermission>[]>;
}

export class PermissionRepository implements IPermissionRepository {
    async create(data: any): Promise<IPermission> {
        //throw new Error("Method not implemented.");
        return Permission.create(data);
    }

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
