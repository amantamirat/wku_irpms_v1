import mongoose from "mongoose";
import { Role, IRole } from "./role.model";
import { CreateRoleDto, UpdateRoleDto } from "./role.dto";


export interface IRoleRepository {
    findById(id: string): Promise<IRole | null>;
    findAll(): Promise<Partial<IRole>[]>;
    findByName(roleName: string): Promise<IRole | null>;
    create(data: CreateRoleDto): Promise<IRole>;
    update(id: string, data: UpdateRoleDto["data"]): Promise<IRole>;
    delete(id: string): Promise<IRole | null>;
}

export class RoleRepository implements IRoleRepository {
    
    async findByName(roleName: string): Promise<IRole | null> {
        //throw new Error("Method not implemented.");
        return Role.findOne({ role_name: roleName });
    }


    async findById(id: string) {
        return Role.findById(new mongoose.Types.ObjectId(id))
            .lean<IRole>()
            .exec();
    }

    async create(dto: CreateRoleDto) {
        const data: Partial<IRole> = {
            role_name: dto.roleName,
            permissions: dto.permissions?.map(id => new mongoose.Types.ObjectId(id)) ?? [],
        };
        return Role.create(data);
    }

    async findAll() {
        const filter: any = {};
        return Role.find(filter).populate("permissions")
            .lean<IRole[]>()
            .exec();
    }


    async update(id: string, dtoData: UpdateRoleDto["data"]) {
        const toUpdate: any = {};

        if (dtoData.roleName) {
            toUpdate.role_name = dtoData.roleName;
        }

        if (dtoData.permissions) {
            toUpdate.permissions = dtoData.permissions.map(p => new mongoose.Types.ObjectId(p));
        }

        const updated = await Role.findByIdAndUpdate(
            new mongoose.Types.ObjectId(id),
            { $set: toUpdate },
            { new: true }
        ).lean<IRole>();

        if (!updated) {
            throw new Error("Role not found.");
        }

        return updated;
    }

    async delete(id: string) {
        return await Role.findByIdAndDelete(new mongoose.Types.ObjectId(id)).exec();
    }
}
