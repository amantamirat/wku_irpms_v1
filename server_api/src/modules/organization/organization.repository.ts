// organization.repository.ts
import mongoose, { Model } from "mongoose";

import {
    Organization,
    College,
    Directorate,
    Department,
    Center,
    Program,
    External
} from "./organization.model";

import {
    CreateOrganizationDTO,
    GetOrganizationsDTO,
    UpdateOrganizationDTO
} from "./organization.dto";
import { Unit } from "./organization.type";

export interface IOrganizationRepository {
    findById(id: string): Promise<any | null>;
    find(options: GetOrganizationsDTO): Promise<any[]>;
    create(data: CreateOrganizationDTO): Promise<any>;
    update(id: string, data: UpdateOrganizationDTO["data"]): Promise<any>;
    delete(id: string): Promise<void>;
}

export class OrganizationRepository implements IOrganizationRepository {

    // ------------------------------------
    // GET BY ID
    // ------------------------------------
    async findById(id: string) {
        return Organization.findById(new mongoose.Types.ObjectId(id))
            .lean()
            .exec();
    }

    // ------------------------------------
    // FIND BY TYPE (all Colleges, all Programs, etc.)
    // ------------------------------------
    async find(filters: GetOrganizationsDTO) {
        const query: any = {};

        if (filters.type) {
            query.type = filters.type;
        }

        if (filters.parent) {
            query.parent = new mongoose.Types.ObjectId(filters.parent);
        }
        return Organization.find(query).populate("parent")
            .lean()
            .exec();
    }

    // ------------------------------------
    // CREATE
    // ------------------------------------
    async create(dto: CreateOrganizationDTO) {

        const data: any = {
            type: dto.type,
            name: dto.name
        };

        // Add parent if needed
        if ("parent" in dto && dto.parent) {
            data.parent = new mongoose.Types.ObjectId(dto.parent);
        }

        // Add Special fields
        if ("academicLevel" in dto) {
            data.academicLevel = dto.academicLevel;
        }

        if ("classification" in dto) {
            data.classification = dto.classification;
        }

        if ("ownership" in dto) {
            data.ownership = dto.ownership;
        }

        // Pick the right discriminator model
        const Model = this.getModelByType(dto.type) as mongoose.Model<any>;
        return Model.create(data);
    }

    // ------------------------------------
    // UPDATE
    // ------------------------------------
    async update(id: string, dtoData: UpdateOrganizationDTO["data"]) {
        const org = await Organization.findById(new mongoose.Types.ObjectId(id));
        if (!org) {
            throw new Error("Organization not found");
        }

        const updated: any = {};

        if (dtoData.name) updated.name = dtoData.name;

        if (dtoData.parent) {
            updated.parent = new mongoose.Types.ObjectId(dtoData.parent);
        }

        if (dtoData.academicLevel) {
            updated.academic_level = dtoData.academicLevel;
        }

        if (dtoData.classification) {
            updated.classification = dtoData.classification;
        }

        if (dtoData.ownership) {
            updated.ownership = dtoData.ownership;
        }

        Object.assign(org, updated);

        return org.save();
    }

    // ------------------------------------
    // DELETE
    // ------------------------------------
    async delete(id: string) {
        await Organization.findByIdAndDelete(new mongoose.Types.ObjectId(id)).exec();
    }

    // ------------------------------------
    // INTERNAL UTILITY
    // Maps type → discriminator model
    // ------------------------------------
    private getModelByType(type: Unit) {
        switch (type) {
            case Unit.College: return College;
            case Unit.Department: return Department;
            case Unit.Program: return Program;
            case Unit.Directorate: return Directorate;
            case Unit.Center: return Center;
            case Unit.External: return External;
            default:
                throw new Error(`Unknown organization type: ${type}`);
        }
    }
}
