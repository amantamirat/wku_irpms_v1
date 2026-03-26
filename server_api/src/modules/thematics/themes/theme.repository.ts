import mongoose from "mongoose";
import { Theme, ITheme } from "./theme.model";
import { CreateThemeDTO, ExistsThemeDTO, GetThemeDTO, UpdateThemeDTO } from "./theme.dto";

export interface IThemeRepository {
    findById(id: string): Promise<ITheme | null>;
    find(filters: GetThemeDTO): Promise<ITheme[]>;
    create(dto: CreateThemeDTO, session?: mongoose.ClientSession): Promise<ITheme>;
    update(id: string, data: UpdateThemeDTO["data"]): Promise<ITheme | null>;
    exists(filters: ExistsThemeDTO): Promise<boolean>;
    deleteMany(dto: { thematic?: string, theme?: string }): Promise<any>; // Added this
    delete(id: string): Promise<ITheme | null>;
}

export class ThemeRepository implements IThemeRepository {

    async findById(id: string) {
        return Theme.findById(new mongoose.Types.ObjectId(id))
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
        let dbQuery = Theme.find(query);
        if (filters.populate) {
            dbQuery
                .populate("parent")
                .populate("thematicArea")
        }
        return dbQuery
            .lean<ITheme[]>()
            .exec();
    }

    async create(dto: CreateThemeDTO, session?: mongoose.ClientSession) {
        const data = {
            ...dto,
            thematicArea: new mongoose.Types.ObjectId(dto.thematicArea),
            ...(dto.parent && { parent: new mongoose.Types.ObjectId(dto.parent) })
        };

        if (session) {
            // When using a session, Mongoose expects an array
            // It returns an array, so we take the first element [0]
            const created = await Theme.create([data], { session });
            return created[0];
        }

        // Standard creation without session
        return await Theme.create(data);
    }

    async update(id: string, dtoData: UpdateThemeDTO["data"]): Promise<ITheme | null> {
        const updateData: Partial<ITheme> = {};

        if (dtoData.title !== undefined) updateData.title = dtoData.title;
        if (dtoData.priority !== undefined) updateData.priority = dtoData.priority;

        return Theme.findByIdAndUpdate(
            new mongoose.Types.ObjectId(id),
            { $set: updateData },
            { new: true }
        ).exec();
    }

    async exists(filters: ExistsThemeDTO): Promise<boolean> {
        const query: any = {};

        if (filters.thematicArea) {
            query.thematicArea = new mongoose.Types.ObjectId(filters.thematicArea);
        }

        if (filters.parent) {
            query.parent = new mongoose.Types.ObjectId(filters.parent);
        }
        const result = await Theme.exists(query).exec();
        return result !== null;
    }

    async deleteMany(dto: { thematic: string; theme: string; }): Promise<any> {
        return Theme.deleteMany({
            ...(dto.thematic !== undefined &&
                { thematicArea: new mongoose.Types.ObjectId(dto.thematic) }),
            ...(dto.theme !== undefined &&
                { theme: new mongoose.Types.ObjectId(dto.theme) })
        }).exec();
    }



    async delete(id: string) {
        return Theme.findByIdAndDelete(new mongoose.Types.ObjectId(id)).exec();
    }
}
