import mongoose from "mongoose";
import { ThemeType, ThemeLevel } from "./theme.enum";
import { BaseTheme, Componenet, FocusArea, ThematicArea, Theme } from "./theme.model";
import { ProjectTheme } from "../projects/themes/project.theme.model";
import { Directorate } from "../organization/organization.model";
import { CacheService } from "../../util/cache/cache.service";


export interface GetThemesOptions {
    type?: ThemeType;
    parent?: mongoose.Types.ObjectId;
    thematic_area?: mongoose.Types.ObjectId;
    directorate?: mongoose.Types.ObjectId;
}

export interface CreateThemeDto {
    type: ThemeType;
    title: string;
    directorate?: mongoose.Types.ObjectId;
    level?: ThemeLevel;
    parent?: mongoose.Types.ObjectId;
    priority?: number;
    thematic_area?: mongoose.Types.ObjectId;
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

        const thematic_area = await ThematicArea.findById(
            theme.type === ThemeType.theme ? parent._id : parent.thematic_area
        ).lean();

        if (!thematic_area) throw new Error("Catalog Not Found!");

        if (theme.type === ThemeType.theme) {
            if (parent.type !== ThemeType.thematic_area)
                throw new Error(`Invalid Theme Parent (${parent.type}) Found!`);
        } else if (theme.type === ThemeType.componenet) {
            if (parent.type !== ThemeType.theme)
                throw new Error(`Invalid Componenet Parent (${parent.type}) Found!`);
            if (thematic_area.level === ThemeLevel.broad)
                throw new Error("Invalid hierarchy: Component must not trace back to Broad catalog");
        } else {
            if (parent.type !== ThemeType.componenet)
                throw new Error(`Invalid Focus Area Parent (${parent.type}) Found!`);
            if (
                thematic_area.level === ThemeLevel.broad ||
                thematic_area.level === ThemeLevel.componenet
            )
                throw new Error("Invalid hierarchy: Focus Area must not trace back to Broad or Component catalog");
        }
        // assign catalog
        (theme as any).thematic_area = thematic_area._id;
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
        if (options.thematic_area) filter.thematic_area = options.thematic_area;
        if (options.directorate) filter.directorate = options.directorate;
        return await BaseTheme.find(filter).lean();
    }

    // ✅ GET user-owned themes 
    static async getUserThemes(userId: string) {
        const organizations = await CacheService.getUserOrganizations(userId);
        return await BaseTheme.find({ directorate: { $in: organizations } }).populate("directorate").lean();
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

        /*
        if (theme.type === ThemeType.thematic_area) {
            const referencedByCall = await Call.exists({ theme: theme._id });
            if (referencedByCall)
                throw new Error(`Can not delete ${theme.title}, it is referenced in call.`);
        }
        */

        const referencedByProject = await ProjectTheme.exists({ theme: theme._id });
        if (referencedByProject)
            throw new Error(`Can not delete ${theme.title}, it is referenced in project.`);

        return await theme.deleteOne();
    }



    static async importThemes(
        thematicAreaId: mongoose.Types.ObjectId,
        data: Array<{
            title: string;
            priority?: number;
            children?: Array<any>;
        }>
    ) {
        // Validate thematic area
        const thematicArea = await ThematicArea.findById(thematicAreaId);
        if (!thematicArea) throw new Error("Thematic Area not found");

        // Determine max depth based on thematic_area level
        let maxDepth: number;
        switch (thematicArea.level) {
            case ThemeLevel.broad:
                maxDepth = 1; // Only theme
                break;
            case ThemeLevel.componenet:
                maxDepth = 2; // Theme → Component
                break;
            case ThemeLevel.narrow:
            default:
                maxDepth = 3; // Theme → Component → FocusArea
                break;
        }

        const createdThemes: any[] = [];

        for (const themeItem of data) {
            const themeDoc = await Theme.create({
                title: themeItem.title,
                type: ThemeType.theme,
                thematic_area: thematicArea._id,
                parent: thematicArea._id,
                priority: themeItem.priority
            });

            let createdComponents: any[] = [];

            if (themeItem.children && themeItem.children.length > 0 && maxDepth >= 2) {
                createdComponents = await this.createSubThemesRecursiveByLevel(
                    themeItem.children,
                    themeDoc._id,
                    thematicArea._id,
                    2,
                    maxDepth
                );
            }

            createdThemes.push({ theme: themeDoc, components: createdComponents });
        }

        return createdThemes;
    }

    // Recursive function with level control
    private static async createSubThemesRecursiveByLevel(
        items: Array<any>,
        parentId: mongoose.Types.ObjectId,
        thematiAreaId: mongoose.Types.ObjectId,
        currentDepth: number,
        maxDepth: number
    ) {
        const created: any[] = [];

        for (const item of items) {
            let doc;
            if (currentDepth === 2) {
                // Component level
                doc = await Componenet.create({
                    title: item.title,
                    type: ThemeType.componenet,
                    thematic_area: thematiAreaId,
                    parent: parentId,
                    priority: item.priority
                });
            } else if (currentDepth === 3) {
                // FocusArea level
                doc = await FocusArea.create({
                    title: item.title,
                    type: ThemeType.focusArea,
                    thematic_area: thematiAreaId,
                    parent: parentId,
                    priority: item.priority
                });
            } else {
                throw new Error(`Invalid depth ${currentDepth} for import`);
            }

            let nested: any[] = [];
            if (item.children && item.children.length > 0 && currentDepth + 1 <= maxDepth) {
                nested = await this.createSubThemesRecursiveByLevel(
                    item.children,
                    doc._id,
                    thematiAreaId,
                    currentDepth + 1,
                    maxDepth
                );
            }

            created.push({ doc, children: nested });
        }

        return created;
    }

}
