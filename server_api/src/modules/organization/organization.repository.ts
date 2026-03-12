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
    ExistsOrganizationDTO,
    GetOrganizationsDTO,
    UpdateOrganizationDTO
} from "./organization.dto";
import { Unit } from "../../common/constants/enums";


export interface IOrganizationRepository {
    findById(id: string): Promise<any | null>;
    findByIds(ids: string[]): Promise<any[]>;
    find(options: GetOrganizationsDTO): Promise<any[]>;
    create(data: CreateOrganizationDTO): Promise<any>;
    update(id: string, data: UpdateOrganizationDTO["data"]): Promise<any>;
    exists(filters: ExistsOrganizationDTO): Promise<boolean>;
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
    // FIND BY MANY IDS
    // ------------------------------------
    async findByIds(ids: string[]) {
        return Organization.find({
            _id: { $in: ids.map(id => new mongoose.Types.ObjectId(id)) }
        })
            // .populate("parent")
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
        if (dto.parent) {
            data.parent = new mongoose.Types.ObjectId(dto.parent);
        }

        // Add Special fields
        if (dto.academicLevel) {
            data.academicLevel = dto.academicLevel;
        }

        if (dto.classification) {
            data.classification = dto.classification;
        }

        if (dto.ownership) {
            data.ownership = dto.ownership;
        }

        // Pick the right discriminator model
        const Model = this.getModelByType(dto.type) as mongoose.Model<any>;
        return Model.create(data);
    }

    // ------------------------------------
    // UPDATE
    // ------------------------------------
    async update(
        id: string,
        dtoData: UpdateOrganizationDTO["data"]
    ) {
        const updateData: any = {};

        if (dtoData.name !== undefined)
            updateData.name = dtoData.name;

        if (dtoData.parent !== undefined)
            updateData.parent = new mongoose.Types.ObjectId(dtoData.parent);

        if (dtoData.academicLevel !== undefined)
            updateData.academicLevel = dtoData.academicLevel;

        if (dtoData.classification !== undefined)
            updateData.classification = dtoData.classification;

        if (dtoData.ownership !== undefined)
            updateData.ownership = dtoData.ownership;

        return Organization.findByIdAndUpdate(
            new mongoose.Types.ObjectId(id),
            { $set: updateData },
            { new: true }
        ).exec();
    }

    async exists(filters: ExistsOrganizationDTO): Promise<boolean> {
        const query: any = {};
        if (filters.parent) {
            query.parent = new mongoose.Types.ObjectId(filters.parent);
        }
        const result = await Organization.exists(query).exec();
        return result !== null;
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
