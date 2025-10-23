import mongoose from "mongoose";
import { Call } from "../call/call.model";
import { AcademicLevel, Classification, Ownership, Unit } from "./organization.enum";
import { Organization } from "./organization.model";


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
    parent?: mongoose.Types.ObjectId;
}

export class OrganizationService {


    static async createOrganization(data: CreateOrganizationDto) {       
        const created = await Organization.create(data);
        return created;
    }

    static async getOrganizations(options: GetOrganizationsOptions) {
        const filter: any = {};
        if (options.type) filter.type = options.type;
        if (options.parent) filter.parent = options.parent;
        return Organization.find(filter).lean();
    }

    static async findOrganization(options: GetOrganizationsOptions) {
        const filter: any = {};
        if (options.id) filter._id = options.id;
        if (options.type) filter.type = options.type;
        if (options.parent) filter.parent = options.parent;
        return Organization.findOne(filter);
    }


    static async updateOrganization(id: string, data: Partial<CreateOrganizationDto>) {
        const organization = await Organization.findById(id);
        if (!organization) throw new Error("Organization not found");
        Object.assign(organization, data);
        return organization.save();
    }

    static async deleteOrganization(id: string) {
        const organization = await Organization.findById(id);
        if (!organization) throw new Error("Organization not found");
        const isParentExist = await Organization.exists({ parent: organization._id });
        if (isParentExist) throw new Error(`Can not delete parent ${organization.type} ${organization.name}`);

        if (organization.type === Unit.Directorate) {
            const isCallExist = await Call.exists({ directorate: organization._id });
            if (isCallExist) throw new Error(`Can not delete ${organization.type} ${organization.name}, Call data exist.`);
            /**
             * const isEvaluationExist = await Evaluation.exists({ directorate: organization._id });
            if (isEvaluationExist) throw new Error(`Can not delete ${organization.type} ${organization.name}, Evaluation data exist.`);

             const isThemeExist = await Catalog.exists({ directorate: organization._id });
            if (isThemeExist) throw new Error(`Can not delete ${organization.type} ${organization.name}, Theme data exist.`);
 
             */

        }
        return await organization.deleteOne();
    }
}
