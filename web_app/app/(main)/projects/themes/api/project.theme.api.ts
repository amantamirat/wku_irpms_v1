import { ApiClient } from "@/api/ApiClient";
import { ProjectTheme } from "../models/project.theme.model";

const end_point = '/project/themes/';

export interface GetProjectThemeOptions {
    project?: string;
}

export const ProjectThemeApi = {

    async getProjectThemes(options: GetProjectThemeOptions): Promise<ProjectTheme[]> {
        const query = new URLSearchParams();
        if (options.project) query.append("project", options.project);
        const data = await ApiClient.get(`${end_point}?${query.toString()}`);
        return data as ProjectTheme[];
    },

    async createProjectTheme(projectTheme: Partial<ProjectTheme>): Promise<ProjectTheme> {
        const createdData = await ApiClient.post(end_point, projectTheme);
        return createdData as ProjectTheme;
    },

    async updateProjectTheme(projectTheme: Partial<ProjectTheme>): Promise<ProjectTheme> {
        if (!projectTheme._id) {
            throw new Error("_id required.");
        }
        const url = `${end_point}${projectTheme._id}`;
        const updatedProjectTheme = await ApiClient.put(url, projectTheme);
        return updatedProjectTheme as ProjectTheme;
    },

    async deleteProjectTheme(projectTheme: Partial<ProjectTheme>): Promise<boolean> {
        if (!projectTheme._id) {
            throw new Error("_id required.");
        }
        const url = `${end_point}${projectTheme._id}`;
        const response = await ApiClient.delete(url);
        return response;
    },
};
