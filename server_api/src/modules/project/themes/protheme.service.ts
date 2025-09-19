import mongoose from "mongoose";
import { ProTheme } from "./protheme.model";


export interface GetProThemeOptions {
    _id?: string;
    project?: string;
    theme?: string;
}

export interface CreateProThemeDto {
    project: mongoose.Types.ObjectId;
    theme: mongoose.Types.ObjectId;
}

export class ProThemeService {   

    static async createProTheme(data: CreateProThemeDto) {        
        const createdProTheme = await ProTheme.create(data);
        return createdProTheme;
    }

    static async getProThemes(options: GetProThemeOptions) {
        const filter: any = {};
        if (options.project) filter.project = options.project;
        const proThemes = await ProTheme.find(filter).populate("theme").lean();
        return proThemes;
    }

    static async findProTheme(options: GetProThemeOptions) {
        const filter: any = {};
        if (options.project) filter.project = options.project;
        if (options._id) filter._id = options._id;
        return await ProTheme.findOne(filter).lean();
    }

    static async updateProTheme(id: string, data: Partial<CreateProThemeDto>) {
        const proTheme = await ProTheme.findById(id);
        if (!proTheme) throw new Error("ProTheme not found");
        Object.assign(proTheme, data);
        return proTheme.save();
    }

    static async deleteProTheme(id: string) {
        const proTheme = await ProTheme.findById(id);
        if (!proTheme) throw new Error("Project Theme not found");       
        return await proTheme.deleteOne();
    }
}
