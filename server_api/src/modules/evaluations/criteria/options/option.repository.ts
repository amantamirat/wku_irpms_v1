import mongoose from "mongoose";
import { Option, IOption } from "./option.model";
import {
    CreateOptionDTO,
    GetOptionsDTO,
    UpdateOptionDTO
} from "./option.dto";

export interface IOptionRepository {
    findById(id: string): Promise<IOption | null>;
    find(filters: GetOptionsDTO): Promise<Partial<IOption>[]>;
    create(dto: CreateOptionDTO): Promise<IOption>;
    update(id: string, data: UpdateOptionDTO["data"]): Promise<IOption>;
    delete(id: string): Promise<IOption | null>;
}

// MongoDB implementation
export class OptionRepository implements IOptionRepository {

    async findById(id: string) {
        return Option.findById(new mongoose.Types.ObjectId(id))
            .lean<IOption>()
            .exec();
    }

    async find(filters: GetOptionsDTO) {
        const query: any = {};

        if (filters.criterion) {
            query.criterion = new mongoose.Types.ObjectId(filters.criterion);
        }

        return Option.find(query)
            .populate("criterion")
            .lean<IOption[]>()
            .exec();
    }

    async create(dto: CreateOptionDTO) {
        const data: Partial<IOption> = {
            criterion: new mongoose.Types.ObjectId(dto.criterion),
            title: dto.title,
            score: dto.score
        };
        return Option.create(data);
    }

    async update(id: string, dtoData: UpdateOptionDTO["data"]): Promise<IOption> {
        const updateData: Partial<IOption> = {};

        if (dtoData.title) updateData.title = dtoData.title;
        if (dtoData.score) updateData.score = dtoData.score;

        const updated = await Option.findByIdAndUpdate(
            new mongoose.Types.ObjectId(id),
            { $set: updateData },
            { new: true }
        ).exec();

        if (!updated) throw new Error("Option not found");
        return updated;
    }

    async delete(id: string) {
        return await Option.findByIdAndDelete(id).exec();
    }
}