import mongoose from "mongoose";
import { ThemeType, ThemeLevel } from "./theme.enum";
import { BaseTheme, ThematicArea } from "./theme.model";
import { Call } from "../call.model";
import { ProjectTheme } from "../../project/themes/project.theme.model";
import { Directorate } from "../../organization/organization.model";
import { CacheService } from "../../../util/cache/cache.service";


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
        if (theme.type === ThemeType.thematic_area) {
            const directorate = await Directorate.findById(theme.directorate);
            if (!directorate) throw new Error("Directorate Not Found!");
            return;
        }

        const parent = await BaseTheme.findById(theme.parent).lean() as any;
        if (!parent) throw new Error("Parent Not Found!");

        const catalog = await ThematicArea.findById(
            theme.type === ThemeType.theme ? parent._id : parent.catalog
        ).lean();

        if (!catalog) throw new Error("Catalog Not Found!");

        if (theme.type === ThemeType.theme) {
            if (parent.type !== ThemeType.thematic_area)
                throw new Error(`Invalid Theme Parent (${parent.type}) Found!`);
        } else if (theme.type === ThemeType.componenet) {
            if (parent.type !== ThemeType.theme)
                throw new Error(`Invalid Componenet Parent (${parent.type}) Found!`);
            if (catalog.level === ThemeLevel.broad)
                throw new Error("Invalid hierarchy: Component must not trace back to Broad catalog");
        } else {
            if (parent.type !== ThemeType.componenet)
                throw new Error(`Invalid Focus Area Parent (${parent.type}) Found!`);
            if (
                catalog.level === ThemeLevel.broad ||
                catalog.level === ThemeLevel.componenet
            )
                throw new Error("Invalid hierarchy: Focus Area must not trace back to Broad or Component catalog");
        }

        // assign catalog
        (theme as any).catalog = catalog._id;
    }

    // ✅ CREATE with ownership validation
    static async createTheme(data: CreateThemeDto, userId: string) {
        if (data.directorate) {
            await CacheService.validateOwnership(userId, data.directorate);
        }
        await this.validateTheme(data);
        const createdTheme = await BaseTheme.create(data);
        return createdTheme;
    }

    // ✅ GET themes (admin-like)
    static async getThemes(options: GetThemesOptions) {
        const filter: any = {};
        if (options.type) filter.type = options.type;
        if (options.parent) filter.parent = options.parent;
        if (options.catalog) filter.catalog = options.catalog;
        if (options.directorate) filter.directorate = options.directorate;
        return await BaseTheme.find(filter).lean();
    }

    // ✅ GET user-owned themes (like getUserGrants)
    static async getUserThemes(userId: string) {
        const organizations = await CacheService.getUserOrganizations(userId);
        return await BaseTheme.find({ directorate: { $in: organizations } }).lean();
    }

    // ✅ UPDATE with ownership validation
    static async updateTheme(id: string, data: Partial<CreateThemeDto>, userId: string) {
        const theme = await BaseTheme.findById(id);
        if (!theme) throw new Error("Theme not found");

        if ((theme as any).directorate) {
            await CacheService.validateOwnership(userId, (theme as any).directorate);
        }

        Object.assign(theme, data);
        return await theme.save();
    }

    // ✅ DELETE with ownership validation
    static async deleteTheme(id: string, userId: string) {
        const theme = await BaseTheme.findById(id);
        if (!theme) throw new Error("Theme not found");

        if ((theme as any).directorate) {
            await CacheService.validateOwnership(userId, (theme as any).directorate);
        }

        const isParentExist = await BaseTheme.exists({ parent: theme._id });
        if (isParentExist) throw new Error(`Can not delete parent ${theme.type} ${theme.title}`);

        if (theme.type === ThemeType.thematic_area) {
            const referencedByCall = await Call.exists({ theme: theme._id });
            if (referencedByCall)
                throw new Error(`Can not delete ${theme.title}, it is referenced in call.`);
        }

        const referencedByProject = await ProjectTheme.exists({ theme: theme._id });
        if (referencedByProject)
            throw new Error(`Can not delete ${theme.title}, it is referenced in project.`);

        return await theme.deleteOne();
    }
}
