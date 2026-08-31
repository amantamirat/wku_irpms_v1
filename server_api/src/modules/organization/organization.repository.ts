// organization.repository.ts
import mongoose from "mongoose";

import {
    Organization,
    College,
    Directorate,
    Department,
    Center,
    Program,
    External,
    IOrganization
} from "./organization.model";

import {
    CreateOrganizationDTO,
    FilterOrganizationsDTO,
    UpdateOrganizationDTO
} from "./organization.dto";

import { Unit } from "../../common/constants/enums";
import { FilterOptions } from "../../common/dtos/filter.dto";


export interface IOrganizationRepository {
    findById(id: string): Promise<IOrganization | null>;

    findOne(
        filter: FilterOrganizationsDTO,
        options?: FilterOptions
    ): Promise<IOrganization | null>;

    find(
        filter: FilterOrganizationsDTO,
        options?: FilterOptions
    ): Promise<IOrganization[]>;

    create(data: CreateOrganizationDTO): Promise<any>;

    update(
        id: string,
        data: UpdateOrganizationDTO["data"]
    ): Promise<any>;

    exists(filters: FilterOrganizationsDTO): Promise<boolean>;

    delete(id: string): Promise<void>;
}


export class OrganizationRepository implements IOrganizationRepository {

    // ------------------------------------
    // GET BY ID
    // ------------------------------------
    async findById(id: string): Promise<IOrganization | null> {
        return Organization.findById(
            new mongoose.Types.ObjectId(id)
        )
            .lean<IOrganization>()
            .exec();
    }


    // ------------------------------------
    // FIND ONE
    // ------------------------------------
    async findOne(
        filters: FilterOrganizationsDTO,
        options?: FilterOptions
    ): Promise<IOrganization | null> {

        const query = this.buildFilter(filters);

        let dbQuery = Organization.findOne(query);

        if (options?.populate) {
            dbQuery = dbQuery.populate("parent");
        }

        return dbQuery
            .lean<IOrganization>()
            .exec();
    }


    // ------------------------------------
    // FIND MANY
    // ------------------------------------
    async find(
        filters: FilterOrganizationsDTO,
        options?: FilterOptions
    ): Promise<IOrganization[]> {

        const query = this.buildFilter(filters);

        let dbQuery = Organization.find(query);

        if (options?.populate) {
            dbQuery = dbQuery.populate("parent");
        }

        return dbQuery
            .lean<IOrganization[]>()
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

        // Add special fields
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
        const Model = this.getModelByType(dto.type);

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

        if (dtoData.name !== undefined) {
            updateData.name = dtoData.name;
        }

        if (dtoData.parent !== undefined) {
            updateData.parent = new mongoose.Types.ObjectId(
                dtoData.parent
            );
        }

        if (dtoData.academicLevel !== undefined) {
            updateData.academicLevel = dtoData.academicLevel;
        }

        if (dtoData.classification !== undefined) {
            updateData.classification = dtoData.classification;
        }

        if (dtoData.ownership !== undefined) {
            updateData.ownership = dtoData.ownership;
        }

        return Organization.findByIdAndUpdate(
            new mongoose.Types.ObjectId(id),
            { $set: updateData },
            { new: true }
        ).exec();
    }


    // ------------------------------------
    // EXISTS
    // ------------------------------------
    async exists(
        filters: FilterOrganizationsDTO
    ): Promise<boolean> {

        const query = this.buildFilter(filters);

        const result = await Organization
            .exists(query)
            .exec();

        return result !== null;
    }


    // ------------------------------------
    // DELETE
    // ------------------------------------
    async delete(id: string): Promise<void> {

        await Organization.findByIdAndDelete(
            new mongoose.Types.ObjectId(id)
        ).exec();
    }


    // ------------------------------------
    // BUILD FILTER
    // ------------------------------------
    private buildFilter(
        filters: FilterOrganizationsDTO
    ): Record<string, any> {

        const query: Record<string, any> = {};

        if (filters.type !== undefined) {
            query.type = filters.type;
        }

        if (filters.parent !== undefined) {
            query.parent = new mongoose.Types.ObjectId(
                filters.parent
            );
        }

        if (filters.name !== undefined) {
            query.name = filters.name;
        }

        return query;
    }


    // ------------------------------------
    // INTERNAL UTILITY
    // Maps type → discriminator model
    // ------------------------------------
    private getModelByType(type: Unit): mongoose.Model<any> {

        switch (type) {
            case Unit.college:
                return College;

            case Unit.department:
                return Department;

            case Unit.program:
                return Program;

            case Unit.directorate:
                return Directorate;

            case Unit.center:
                return Center;

            case Unit.external:
                return External;

            default:
                throw new Error(
                    `Unknown organization type: ${type}`
                );
        }
    }
}

