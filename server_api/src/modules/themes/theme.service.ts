import { Types } from "mongoose";
import { ThemeLevel } from "./enums/theme.level.enum";
import { ThemeType } from "./enums/theme.type.enum";
import { Theme } from "./base.theme.model";
import { Directorate } from "../organs/organization.model";

export interface GetThemesOptions {
    type?: ThemeType;
    parent?: string;
    catalog?: string;
    directorate?: string;
}

export interface CreateThemeDto {
    _id?: string;
    type: ThemeType;
    title: string;
    priority?: number;
    level?: ThemeLevel;
    parent?: Types.ObjectId;
    catalog?: Types.ObjectId;
    directorate?: Types.ObjectId;
}

type NonRootTypes = ThemeType.theme | ThemeType.componenet | ThemeType.focusArea;

export class ThemeService {

    private static readonly parentType: Record<NonRootTypes, ThemeType> = {
        [ThemeType.theme]: ThemeType.catalog,
        [ThemeType.componenet]: ThemeType.theme,
        [ThemeType.focusArea]: ThemeType.componenet,
    };

    private static async validateThemeHierarchy(theme: Partial<CreateThemeDto>) {
        if (theme.type === ThemeType.catalog) {
            const directorate = await Directorate.findById(theme.directorate);
            if (!directorate) {
                throw new Error("Directorate Not Found!");
            }
            return
        }
        const parent = await Theme.findById(theme.parent).lean() as any;
        if (!parent) {
            throw new Error("Parent Not Found!");
        }
        const requiredParentType = this.parentType[theme.type as NonRootTypes];
        if (parent.type !== requiredParentType) {
            throw new Error(`${theme.type} must have parent of type ${requiredParentType}`);
        }
        // assign catalog
        (theme as any).catalog = theme.type === ThemeType.theme ? parent._id : parent.catalog;

        const catalog = await Theme.findById(theme.catalog).lean() as any;
        if (!catalog) {
            throw new Error("Catalog Not Found!");
        }
        if (theme.type === ThemeType.componenet && (catalog.level === ThemeLevel.broad)) {
            throw new Error("Invalid hierarchy: Component must not trace back to Broad catalog");
        }
        if (theme.type === ThemeType.focusArea && (catalog.level === ThemeLevel.broad || catalog.level === ThemeLevel.componenet)) {
            throw new Error("Invalid hierarchy: Focus Area must not trace back to Broad or Component catalog");
        }
    }

    static async createTheme(data: CreateThemeDto) {
        //const { type, ...rest } = data;
        await this.validateThemeHierarchy(data);
        if (!Theme.discriminators || !Theme.discriminators[data.type]) {
            throw new Error(`Invalid theme type: ${data.type}`);
        }
        const model = Theme.discriminators[data.type];
        const createdTheme = await model.create(data);
        return createdTheme;
    }

    static async getThemes(options: GetThemesOptions) {
        const filter: any = {};
        if (options.type) filter.type = options.type;
        if (options.parent) filter.parent = options.parent;
        if (options.catalog) filter.catalog = options.catalog;
        if (options.directorate) filter.directorate = options.directorate;
        const themes = await Theme.find(filter).lean();
        //console.log(themes);
        return themes;
    }

    static async updateTheme(id: string, data: Partial<CreateThemeDto>) {
        const theme = await Theme.findById(id);
        if (!theme) throw new Error("Theme not found");
        await this.validateThemeHierarchy(data);
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
