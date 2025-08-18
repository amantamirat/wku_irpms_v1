import { Types } from "mongoose";
import { ThemeLevel } from "./enums/theme.level.enum";
import { ThemeType } from "./enums/theme.type.enum";
import { Theme } from "./base.theme.model";
//import { Catalog } from "./catalog.theme.model";
//import { BroadTheme } from "./broad.theme.model";
//import { Componenet } from "./componenet.theme.model";
//import { FocusArea } from "./focus.area.theme.model";

export interface GetThemesOptions {
    type?: ThemeType;
    parent?: string;
    directorate?: string;
}

export interface CreateThemeDto {
    type: ThemeType;
    title: string;
    priority?: number;
    level?: ThemeLevel;
    parent?: Types.ObjectId;
    directorate?: Types.ObjectId;
}

export class ThemeService {

    static async createTheme(data: CreateThemeDto) {
        const { type, ...rest } = data;
        if (!Theme.discriminators || !Theme.discriminators[type]) {
            throw new Error(`Invalid theme type: ${type}`);
        }
        const model = Theme.discriminators[type];
        const createdTheme = await model.create({ type, ...rest });
        return createdTheme;
    }

    static async getThemes(options: GetThemesOptions) {
        const filter: any = {};
        if (options.type) filter.type = options.type;
        if (options.parent) filter.parent = options.parent;
        if (options.directorate) filter.directorate = options.directorate;

        return Theme.find(filter).lean();
    }

    static async updateTheme(id: string, data: Partial<CreateThemeDto>) {
        const theme = await Theme.findById(id);
        if (!theme) throw new Error("Theme not found");
        if (data.type && data.type !== theme.type) {
            throw new Error("Cannot change theme type");
        }
        Object.assign(theme, data);
        return theme.save(); // triggers pre-save hooks
    }

    static async deleteTheme(id: string) {
        const theme = await Theme.findById(id);
        if (!theme) throw new Error("Theme not found");
        return await theme.deleteOne();
    }
}
