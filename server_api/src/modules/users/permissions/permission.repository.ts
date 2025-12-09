import { IPermission, Permission } from "./permission.model";

export interface IPermissionRepository {
    create(data: any): Promise<IPermission>;
    findByName(name: string): Promise<IPermission | null>;
    //findByNames(names: string[]): Promise<IPermission[]>;
    findAll(): Promise<Partial<IPermission>[]>;
}

export class PermissionRepository implements IPermissionRepository {

    async findByName(name: string): Promise<IPermission | null> {
        return Permission.findOne({ name: name });
    }
    
    async create(data: any): Promise<IPermission> {
        return Permission.create(data);
    }
    

    /*
    async findByNames(names: string[]): Promise<IPermission[]> {
        return Permission.find({ name: { $in: names } });
    }
        */
    async findAll() {
        const filter: any = {};
        return Permission.find(filter)
            .lean<IPermission[]>()
            .exec();
    }
}
