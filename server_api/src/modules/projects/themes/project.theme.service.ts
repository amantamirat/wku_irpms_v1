import mongoose from "mongoose";
import { Project } from "../project.model";
import { ProjectTheme } from "./project.theme.model";
import { Theme } from "../../thematics/themes/theme.model";


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

    private static async validateProjectTheme(pt: CreateProjectThemeDto) {
        const project = await Project.findById(pt.project).populate("call").lean() as any;
        if (!project) throw new Error("Project not found");
        const theme = await Theme.findOne({ _id: pt.theme, thematicArea: project.call.theme }).lean();
        if (!theme) throw new Error("Theme not found");
    }

    static async createProjectTheme(data: CreateProjectThemeDto) {
        await this.validateProjectTheme(data);
        const createdProTheme = await ProjectTheme.create(data);
        return createdProTheme;
    }

    static async getProjectThemes(options: GetProjectThemeOptions) {
        const filter: any = {};
        if (options.project) {
            filter.project = options.project;
        }
        if (options.theme) {
            filter.theme = options.theme;
        }

        const proThemes = await ProjectTheme.find(filter).populate("project").populate("theme").lean();
        return proThemes;

    }

    static async deleteProjectTheme(id: string) {
        const proTheme = await ProjectTheme.findById(id);
        if (!proTheme) throw new Error("Project Theme not found");
        return await proTheme.deleteOne();
    }
}
