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
    update(id: string, data: UpdateGrantDTO["data"]): Promise<IGrant>;
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

        if (filters.directorateId) {
            query.directorate = new mongoose.Types.ObjectId(filters.directorateId);
        }

        return Grant.find(query)
            .populate("directorate")
            .lean<IGrant[]>()
            .exec();
    }

    async create(dto: CreateGrantDTO) {
        const data: Partial<IGrant> = {
            directorate: new mongoose.Types.ObjectId(dto.directorateId),
            title: dto.title,
            description: dto.description,
            //createdBy: new mongoose.Types.ObjectId(dto.userId)
        };
        return Grant.create(data);
    }

    async update(id: string, dtoData: UpdateGrantDTO["data"]): Promise<IGrant> {
        const updateData: Partial<IGrant> = {};

        if (dtoData.title) updateData.title = dtoData.title;
        if (dtoData.description) updateData.description = dtoData.description;       

        const updated = await Grant.findByIdAndUpdate(
            new mongoose.Types.ObjectId(id),
            { $set: updateData },
            { new: true }
        ).exec();

        if (!updated) throw new Error("Grant not found");
        return updated;
    }

    async delete(id: string) {
        return await Grant.findByIdAndDelete(id).exec();
    }
}