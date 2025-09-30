import { ApiClient } from "@/api/ApiClient";
import { ProjectTheme } from "../models/project.theme.model";
import { Project } from "../../models/project.model";
import { Theme } from "@/app/(main)/themes/models/theme.model";
const end_point = '/project/themes/';

function sanitizeProjectTheme(projectTheme: Partial<ProjectTheme>): Partial<ProjectTheme> {
    return {
        ...projectTheme,
        project:
            typeof projectTheme.project === "object" && projectTheme.project !== null
                ? (projectTheme.project as Project)._id
                : projectTheme.project,
        theme:
            typeof projectTheme.theme === "object" && projectTheme.theme !== null
                ? (projectTheme.theme as Theme)._id
                : projectTheme.theme,
    };
}

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
        const santized = sanitizeProjectTheme(projectTheme);
        const createdData = await ApiClient.post(end_point, santized);
        return createdData as ProjectTheme;
    },

    async updateProjectTheme(projectTheme: Partial<ProjectTheme>): Promise<ProjectTheme> {
        if (!projectTheme._id) {
            throw new Error("_id required.");
        }
        const url = `${end_point}${projectTheme._id}`;
        const santized = sanitizeProjectTheme(projectTheme);
        const updatedProjectTheme = await ApiClient.put(url, santized);
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
