import mongoose from "mongoose";
import { UpdatePermissionDto } from "./permission.dto";
import { IPermission, Permission } from "./permission.model";

export interface IPermissionRepository {
    create(data: any): Promise<IPermission>;
    findByName(name: string): Promise<IPermission | null>;
    findByNames(names: string[]): Promise<IPermission[]>;
    findAll(): Promise<Partial<IPermission>[]>;
    update(id: string, data: UpdatePermissionDto["data"]): Promise<IPermission | null>;
    delete(id: string): Promise<IPermission | null>;
}

export class PermissionRepository implements IPermissionRepository {

    async findByName(name: string): Promise<IPermission | null> {
        return Permission.findOne({ name: name });
    }

    async create(data: any): Promise<IPermission> {
        return Permission.create(data);
    }

    async findByNames(names: string[]): Promise<IPermission[]> {
        return Permission.find({ name: { $in: names } });
    }

    async findAll() {
        const filter: any = {};
        return Permission.find(filter)
            .lean<IPermission[]>()
            .exec();
    }

    update(id: string, dtoData: UpdatePermissionDto["data"]): Promise<IPermission | null> {
        const toUpdate: any = {};
        if (dtoData.name) {
            toUpdate.name = dtoData.name;
        }
        return Permission.findByIdAndUpdate(
            new mongoose.Types.ObjectId(id),
            { $set: toUpdate },
            { new: true }
        ).exec();
    }

    async delete(id: string) {
        return Permission.findByIdAndDelete(id).exec();
    }

}
