import mongoose from "mongoose";
import { Grant, IGrant } from "./grant.model";
import {
    CreateGrantDTO,
    GetGrantsDTO,
    UpdateGrantDTO
} from "./grant.dto";

export interface IGrantRepository {
    findById(id: string): Promise<IGrant | null>;
    find(filters: GetGrantsDTO): Promise<Partial<IGrant>[]>;
    create(dto: CreateGrantDTO): Promise<IGrant>;
    update(id: string, data: UpdateGrantDTO["data"]): Promise<IGrant | null>;
    delete(id: string): Promise<IGrant | null>;
}

// MongoDB implementation
export class GrantRepository implements IGrantRepository {

    async findById(id: string) {
        return Grant.findById(new mongoose.Types.ObjectId(id))
            .lean<IGrant>()
            .exec();
    }

    async find(filters: GetGrantsDTO) {
        const query: any = {};

        if (filters.organization) {
            query.organization = new mongoose.Types.ObjectId(filters.organization);
        }

        if (filters.fundingSource) {
            query.fundingSource = filters.fundingSource;
        }

        return Grant.find(query).populate("organization")
            .lean<IGrant[]>()
            .exec();
    }

    async create(dto: CreateGrantDTO) {
        const data: Partial<IGrant> = {
            fundingSource: dto.fundingSource,
            organization: new mongoose.Types.ObjectId(dto.organization),
            title: dto.title,
            description: dto.description,
            amount: dto.amount
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
        )
            .exec();
    }

    async delete(id: string) {
        return Grant.findByIdAndDelete(
            new mongoose.Types.ObjectId(id)
        ).exec();
    }
}
