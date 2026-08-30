import mongoose from "mongoose";
import { Thematic, IThematic } from "./thematic.model";
import {
    CreateThematicDTO,
    FilterThematicsDTO,
    UpdateThematicDTO
} from "./thematic.dto";

export interface IThematicRepository {
    findById(id: string): Promise<IThematic | null>;
    findOne(dto: FilterThematicsDTO): Promise<IThematic | null>;
    find(filters: FilterThematicsDTO): Promise<Partial<IThematic>[]>;
    create(dto: CreateThematicDTO): Promise<IThematic>;
    update(id: string, data: UpdateThematicDTO["data"]): Promise<IThematic | null>;
    delete(id: string): Promise<IThematic | null>;
}

// MongoDB implementation
export class ThematicRepository implements IThematicRepository {

    async findById(id: string) {
        return Thematic.findById(new mongoose.Types.ObjectId(id))
            .lean<IThematic>()
            .exec();
    }


    async findOne({ title, level, status }: FilterThematicsDTO) {
        const filter: Record<string, any> = {};

        if (title) {
            filter.title = title;
        }

        if (level) {
            filter.level = level;
        }

        if (status) {
            filter.status = status;
        }

        return Thematic.findOne(filter)
            .lean<IThematic>()
            .exec();
    }

    async find(filters: FilterThematicsDTO) {
        const query: any = {};
        if (filters.status) {
            query.status = filters.status;
        }
        return Thematic.find(query)
            .lean<IThematic[]>()
            .exec();
    }

    async create(dto: CreateThematicDTO) {
        return Thematic.create({
            ...dto,
        });
    }

    async update(id: string, dtoData: UpdateThematicDTO["data"]): Promise<IThematic | null> {
        const updateData: Partial<IThematic> = {};

        if (dtoData.title) updateData.title = dtoData.title;
        if (dtoData.description) updateData.description = dtoData.description;
        if (dtoData.status) updateData.status = dtoData.status;

        return Thematic.findByIdAndUpdate(
            new mongoose.Types.ObjectId(id),
            { $set: updateData },
            { new: true }
        ).exec();
    }

    async delete(id: string) {
        return Thematic.findByIdAndDelete(id).exec();
    }
}