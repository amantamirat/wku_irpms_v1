import mongoose from "mongoose";
import { Thematic, IThematic } from "./thematic.model";
import {
    CreateThematicDTO,
    GetThematicsDTO,
    UpdateThematicDTO
} from "./thematic.dto";

export interface IThematicRepository {
    findById(id: string): Promise<IThematic | null>;
    find(filters: GetThematicsDTO): Promise<Partial<IThematic>[]>;
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

    async find(filters: GetThematicsDTO) {
        const query: any = {};

        if (filters.directorate) {
            query.directorate = new mongoose.Types.ObjectId(filters.directorate);
        }

        let dbQuery = Thematic.find(query);
        if (filters.populate) {
            dbQuery = dbQuery
                .populate("directorate")
        }
        return dbQuery
            .lean<IThematic[]>()
            .exec();
    }

    async create(dto: CreateThematicDTO) {
        return Thematic.create({
            ...dto,
            directorate: new mongoose.Types.ObjectId(dto.directorate)
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