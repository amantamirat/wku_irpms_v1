import mongoose from "mongoose";
import { Grant, GrantStatus, IGrant } from "./grant.model";
import {
    CreateGrantDTO,
    ExistsGrantDTO,
    GetGrantsDTO,
    UpdateGrantDTO
} from "./grant.dto";

export interface IGrantRepository {
    findById(id: string, populate?: boolean): Promise<IGrant | null>;
    find(filters: GetGrantsDTO): Promise<Partial<IGrant>[]>;
    create(dto: CreateGrantDTO): Promise<IGrant>;
    update(id: string, data: UpdateGrantDTO["data"]): Promise<IGrant | null>;
    updateStatus(id: string, newStatus: GrantStatus): Promise<IGrant | null>;
    exists(filters: ExistsGrantDTO): Promise<boolean>;
    delete(id: string): Promise<IGrant | null>;
}

// MongoDB implementation
export class GrantRepository implements IGrantRepository {

    async findById(id: string, populate?: boolean) {
        let dbQuery = Grant.findById(new mongoose.Types.ObjectId(id));
        if (populate === true) {
            dbQuery
                .populate("organization")
                .populate("thematic")
        }
        return dbQuery
            .lean<IGrant>()
            .exec();
    }

    async find(filters: GetGrantsDTO) {
        const query: any = {};

        if (filters.organization) {
            query.organization = new mongoose.Types.ObjectId(filters.organization);
        }

        if (filters.thematic) {
            query.thematic = new mongoose.Types.ObjectId(filters.thematic);
        }

        if (filters.fundingSource) {
            query.fundingSource = filters.fundingSource;
        }

        if (filters.status) {
            query.status = filters.status;
        }

        let dbQuery = Grant.find(query);
        if (filters.populate) {
            dbQuery
                .populate("organization")
                .populate("thematic")
        }
        return dbQuery
            .lean<IGrant[]>()
            .exec();
    }

    async create(dto: CreateGrantDTO) {
        const data: Partial<IGrant> = {
            fundingSource: dto.fundingSource,
            organization: new mongoose.Types.ObjectId(dto.organization),
            title: dto.title,
            amount: dto.amount,
            thematic: new mongoose.Types.ObjectId(dto.thematic),
            description: dto.description
        };

        return Grant.create(data);
    }

    async update(id: string, dtoData: UpdateGrantDTO["data"]): Promise<IGrant | null> {

        const updateData: Partial<IGrant> = {};

        if (dtoData.title !== undefined)
            updateData.title = dtoData.title;

        if (dtoData.description !== undefined)
            updateData.description = dtoData.description;

        if (dtoData.amount !== undefined)
            updateData.amount = dtoData.amount;

        return Grant.findByIdAndUpdate(
            new mongoose.Types.ObjectId(id),
            { $set: updateData },
            { new: true }
        ).exec();
    }

    async updateStatus(id: string, newStatus: GrantStatus) {
        return Grant.findByIdAndUpdate(
            new mongoose.Types.ObjectId(id),
            { $set: { status: newStatus } },
            { new: true }
        ).exec();
    }

    async exists(filters: ExistsGrantDTO): Promise<boolean> {
        const query: any = {};
        const { organization, thematic } = filters;
        if (organization) {
            query.organization = new mongoose.Types.ObjectId(organization);
        }
        if (thematic) {
            query.thematic = new mongoose.Types.ObjectId(thematic);
        }
        const result = await Grant.exists(query).exec();
        return result !== null;
    }

    async delete(id: string) {
        return Grant.findByIdAndDelete(
            new mongoose.Types.ObjectId(id)
        ).exec();
    }
}
