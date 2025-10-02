import mongoose from "mongoose";
import { ThemeType, ThemeLevel } from "./theme.enum";
import { BaseTheme, Catalog } from "./theme.model";
import { Call } from "../call.model";
import { ProjectTheme } from "../../project/themes/project.theme.model";
import { Directorate } from "../../organization/organization.model";

export interface GetThemesOptions {
    type?: ThemeType;
    parent?: mongoose.Types.ObjectId;
    catalog?: mongoose.Types.ObjectId;
    directorate?: mongoose.Types.ObjectId;
}

export interface CreateThemeDto {
    type: ThemeType;
    title: string;
    directorate?: mongoose.Types.ObjectId;
    level?: ThemeLevel;
    parent?: mongoose.Types.ObjectId;
    priority?: number;
    catalog?: mongoose.Types.ObjectId;
}

export class ThemeService {

    private static async validateTheme(theme: Partial<CreateThemeDto>) {
        if (theme.type === ThemeType.catalog) {
            const directorate = await Directorate.findById(theme.directorate);
            if (!directorate) {
                throw new Error("Directorate Not Found!");
            }
            return
        }
        const parent = await BaseTheme.findById(theme.parent).lean() as any;
        if (!parent) {
            throw new Error("Parent Not Found!");
        }

        const catalog = await Catalog.findById(theme.type === ThemeType.theme ? parent._id : parent.catalog).lean();
        if (!catalog) {
            throw new Error("Catalog Not Found!");
        }

        if (theme.type === ThemeType.theme) {
            if (parent.type !== ThemeType.catalog) {
                throw new Error(`Invalid Theme Parent (${parent.type}) Found!`);
            }
        }
        else if (theme.type === ThemeType.componenet) {
            if (parent.type !== ThemeType.theme) {
                throw new Error(`Invalid Componenet Parent (${parent.type}) Found!`);
            }
            if (catalog.level === ThemeLevel.broad) {
                throw new Error("Invalid hierarchy: Component must not trace back to Broad catalog");
            }
        }
        else {
            if (parent.type !== ThemeType.componenet) {
                throw new Error(`Invalid Focus Area Parent (${parent.type}) Found!`);
            }
            if ((catalog.level === ThemeLevel.broad || catalog.level === ThemeLevel.componenet)) {
                throw new Error("Invalid hierarchy: Focus Area must not trace back to Broad or Component catalog");
            }
        }
        // assign catalog
        (theme as any).catalog = catalog._id;
    }

    static async createTheme(data: CreateThemeDto) {
        await this.validateTheme(data);
        const createdTheme = await BaseTheme.create(data);
        return createdTheme;
    }

    static async getThemes(options: GetThemesOptions) {
        const filter: any = {};
        if (options.type) filter.type = options.type;
        if (options.parent) filter.parent = options.parent;
        if (options.catalog) filter.catalog = options.catalog;
        if (options.directorate) filter.directorate = options.directorate;
        const themes = await BaseTheme.find(filter).lean();
        return themes;
    }

    static async updateTheme(id: string, data: Partial<CreateThemeDto>) {
        const theme = await BaseTheme.findById(id);
        if (!theme) throw new Error("Theme not found");
        await this.validateTheme(data);
        Object.assign(theme, data);
        return theme.save(); // triggers pre-save hooks
    }

    static async deleteTheme(id: string) {
        const theme = await BaseTheme.findById(id);
        if (!theme) throw new Error("Theme not found");
        const isParentExist = await BaseTheme.exists({ parent: theme._id });
        if (isParentExist) throw new Error(`Can not delete parent ${theme.type} ${theme.title}`);
        if (theme.type === ThemeType.catalog) {
            const referencedByCall = await Call.exists({ theme: theme._id });
            if (referencedByCall) throw new Error(`Can not delete ${theme.title}, it is referenced in call.`);
        }
        const referencedByProject = await ProjectTheme.exists({ theme: theme._id });
        if (referencedByProject) throw new Error(`Can not delete ${theme.title}, it is referenced in project.`);
        return await theme.deleteOne();
    }
}
