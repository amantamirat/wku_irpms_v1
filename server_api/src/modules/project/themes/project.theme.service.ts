import mongoose from "mongoose";
import { ProjectTheme } from "./project.theme.model";
import { Project } from "../project.model";
import { BaseTheme } from "../../call/themes/theme.model";
import { ThemeType } from "../../call/themes/theme.enum";
import { CreateCallDto } from "../../call/call.service";


export interface GetProjectThemeOptions {
    _id?: string;
    project?: string;
    theme?: string;
}

export interface CreateProjectThemeDto {
    project?: mongoose.Types.ObjectId;
    theme: mongoose.Types.ObjectId;
}

export class ProjectThemeService {

    static async validateThemeCall(themeId: mongoose.Types.ObjectId, call: CreateCallDto) {
        const theme = await BaseTheme.findById(themeId).lean();
        if (!theme) throw new Error("Theme not found");
        if (theme.type === ThemeType.catalog) throw new Error("Invalid theme (catalog) found");
        if (call.theme?.toString() !== (theme as any).catalog?.toString()) {
            throw new Error("Selected theme is not valid for this project's call.");
        }
    }

    private static async validateProjectTheme(pt: CreateProjectThemeDto) {
        const project = await Project.findById(pt.project).populate<{ call: CreateCallDto }>("call").lean();
        if (!project) throw new Error("Project not found");
        await this.validateThemeCall(pt.theme, project.call);
    }

    static async createProjectTheme(data: CreateProjectThemeDto) {
        await this.validateProjectTheme(data);
        const createdProTheme = await ProjectTheme.create(data);
        return createdProTheme;
    }

    static async getProjectThemes(options: GetProjectThemeOptions) {
        const filter: any = {};
        if (options.project) filter.project = options.project;
        const proThemes = await ProjectTheme.find(filter).populate("theme").lean();
        return proThemes;
    }

    static async findProjectTheme(options: GetProjectThemeOptions) {
        const filter: any = {};
        if (options.project) filter.project = options.project;
        if (options._id) filter._id = options._id;
        return await ProjectTheme.findOne(filter).lean();
    }

    static async updateProjectTheme(id: string, data: Partial<CreateProjectThemeDto>) {
        const proTheme = await ProjectTheme.findById(id);
        if (!proTheme) throw new Error("ProTheme not found");
        Object.assign(proTheme, data);
        return proTheme.save();
    }

    static async deleteProjectTheme(id: string) {
        const proTheme = await ProjectTheme.findById(id);
        if (!proTheme) throw new Error("Project Theme not found");
        return await proTheme.deleteOne();
    }
}
