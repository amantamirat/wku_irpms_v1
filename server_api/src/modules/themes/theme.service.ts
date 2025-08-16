
import { Types } from "mongoose";
import { ThemeLevel } from "./enums/themeLevel.enum";
import { ThemeType } from "./enums/themeType.enum";
import { Theme } from "./base.model";


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
        const model = (Theme.discriminators as any)[type];
        if (!model) throw new Error(`Invalid theme type: ${type}`);
        return model.create({ type, ...rest });
    }

    static async getThemes(type?: ThemeType, parent?: Types.ObjectId) {
        const filter: any = {};
        if (type) filter.type = type;
        if (parent) filter.parent = parent;
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
        const theme = await Theme.findByIdAndDelete(id);
        if (!theme) throw new Error("Theme not found");
        return theme;
    }
}
