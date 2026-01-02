import mongoose from "mongoose";
import { Theme, ITheme } from "./theme.model";
import { CreateThemeDTO, GetThemeDTO, UpdateThemeDTO } from "./theme.dto";

export interface IThemeRepository {
    findById(id: string): Promise<ITheme | null>;
    find(filters: GetThemeDTO): Promise<Partial<ITheme>[]>;
    create(dto: CreateThemeDTO): Promise<ITheme>;
    update(id: string, data: UpdateThemeDTO["data"]): Promise<ITheme>;
    delete(id: string): Promise<ITheme | null>;
}

export class ThemeRepository implements IThemeRepository {

    async findById(id: string) {
        return Theme.findById(new mongoose.Types.ObjectId(id))
            //.populate("parent")
            //.populate("thematicArea")
            .lean<ITheme>()
            .exec();
    }

    async find(filters: GetThemeDTO) {
        const query: any = {};
        if (filters.thematicArea) {
            query.thematicArea = new mongoose.Types.ObjectId(filters.thematicArea);
        }
        if (filters.parent) {
            query.parent = new mongoose.Types.ObjectId(filters.parent);
        }
        if (filters.level !== undefined) {//explicitly for zero
            query.level = filters.level;
        }
        return Theme.find(query)
            .populate("parent")
            .populate("thematicArea")
            .lean<ITheme[]>()
            .exec();
    }

    async create(dto: CreateThemeDTO) {
        const data: any = {
            ...dto,
            thematicArea: new mongoose.Types.ObjectId(dto.thematicArea),
        };
        if (dto.parent) {
            data.parent = new mongoose.Types.ObjectId(dto.parent);
        }
        return Theme.create(data);
    }

    async update(id: string, dtoData: UpdateThemeDTO["data"]): Promise<ITheme> {
        const updateData: Partial<ITheme> = {};

        if (dtoData.title !== undefined) updateData.title = dtoData.title;
        if (dtoData.priority !== undefined) updateData.priority = dtoData.priority;

        const updated = await Theme.findByIdAndUpdate(
            new mongoose.Types.ObjectId(id),
            { $set: updateData },
            { new: true }
        ).exec();

        if (!updated) throw new Error("Theme not found");

        return updated;
    }

    async delete(id: string) {
        return Theme.findByIdAndDelete(new mongoose.Types.ObjectId(id)).exec();
    }
}
