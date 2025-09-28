import mongoose from "mongoose";
import { Unit, AcademicLevel, Classification, Ownership, Category } from "./organization.enum";
import { BaseOrganization } from "./organization.model";


export interface GetOrganizationsOptions {
    id?: mongoose.Types.ObjectId;
    type?: Unit;
    parent?: mongoose.Types.ObjectId;
}

export interface CreateOrganizationDto {
    type: Unit;
    name: string;    
    academic_level?: AcademicLevel;
    classification?: Classification;
    ownership?: Ownership;
    //address?: Address;
    category?: Category;
    parent?: mongoose.Types.ObjectId;
}

export class OrganizationService {


    static async createOrganization(data: CreateOrganizationDto) {
        const { type, ...rest } = data;
        if (!BaseOrganization.discriminators || !BaseOrganization.discriminators[type]) {
            throw new Error(`Invalid organization type: ${type}`);
        }
        const model = BaseOrganization.discriminators[type];
        const createdOrganization = await model.create({ type, ...rest });
        return createdOrganization;
    }

    static async getOrganizations(options: GetOrganizationsOptions) {
        const filter: any = {};
        if (options.type) filter.type = options.type;
        if (options.parent) filter.parent = options.parent;
        return BaseOrganization.find(filter).lean();
    }

    static async findOrganization(options: GetOrganizationsOptions) {
        const filter: any = {};
        if (options.id) filter._id = options.id;
        if (options.type) filter.type = options.type;
        if (options.parent) filter.parent = options.parent;
        return BaseOrganization.findOne(filter);
    }


    static async updateOrganization(id: string, data: Partial<CreateOrganizationDto>) {
        const organization = await BaseOrganization.findById(id);
        if (!organization) throw new Error("Organization not found");
        Object.assign(organization, data);
        return organization.save();
    }

    static async deleteOrganization(id: string) {
        const organization = await BaseOrganization.findById(id);
        if (!organization) throw new Error("Organization not found");
        const isParent = await BaseOrganization.exists({ parent: organization._id });
        if (isParent) throw new Error(`Can not delete parent ${organization.type} ${organization.name}`);
        return await organization.deleteOne();
    }
}
