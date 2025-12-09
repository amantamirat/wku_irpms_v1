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
    update(id: string, data: UpdateThematicDTO["data"]): Promise<IThematic>;
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

        return Thematic.find(query)
            .populate("directorate")
            .lean<IThematic[]>()
            .exec();
    }

    async create(dto: CreateThematicDTO) {
        const data: Partial<IThematic> = {
            directorate: new mongoose.Types.ObjectId(dto.directorate),
            title: dto.title,
            level:dto.level,
            description: dto.description,
        };
        return Thematic.create(data);
    }

    async update(id: string, dtoData: UpdateThematicDTO["data"]): Promise<IThematic> {
        const updateData: Partial<IThematic> = {};

        if (dtoData.title) updateData.title = dtoData.title;
        if (dtoData.description) updateData.description = dtoData.description;       

        const updated = await Thematic.findByIdAndUpdate(
            new mongoose.Types.ObjectId(id),
            { $set: updateData },
            { new: true }
        ).exec();

        if (!updated) throw new Error("Thematic not found");
        return updated;
    }

    async delete(id: string) {
        return await Thematic.findByIdAndDelete(id).exec();
    }
}