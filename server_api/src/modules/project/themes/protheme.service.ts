import mongoose from "mongoose";
import { ProjectTheme } from "./protheme.model";


export interface GetProThemeOptions {
    _id?: string;
    project?: string;
    theme?: string;
}

export interface CreateProThemeDto {
    project: mongoose.Types.ObjectId;
    theme: mongoose.Types.ObjectId;
}

export class ProjectThemeService {   

    static async createProjectTheme(data: CreateProThemeDto) {        
        const createdProTheme = await ProjectTheme.create(data);
        return createdProTheme;
    }

    static async getProjectThemes(options: GetProThemeOptions) {
        const filter: any = {};
        if (options.project) filter.project = options.project;
        const proThemes = await ProjectTheme.find(filter).populate("theme").lean();
        return proThemes;
    }

    static async findProjectTheme(options: GetProThemeOptions) {
        const filter: any = {};
        if (options.project) filter.project = options.project;
        if (options._id) filter._id = options._id;
        return await ProjectTheme.findOne(filter).lean();
    }

    static async updateProjectTheme(id: string, data: Partial<CreateProThemeDto>) {
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
