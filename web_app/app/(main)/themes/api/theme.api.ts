import { Organization } from "@/models/organization";
import { ApiClient } from "@/api/ApiClient";
import { Theme, ThemeType } from "../models/theme.model";


const end_point = '/thms';

function sanitizeTheme(theme: Partial<Theme>): Partial<Theme> {
    return {
        ...theme,
        directorate:
            typeof theme.directorate === 'object' && theme.directorate !== null
                ? (theme.directorate as Organization)._id
                : theme.directorate,
        parent:
            typeof theme.parent === 'object' && theme.parent !== null
                ? (theme.parent as Theme)._id
                : theme.parent,
    };
}


export interface GetThemesOptions {
    type?: ThemeType;
    parent?: string;
    directorate?: string;
}

export const ThemeApi = {

    async createTheme(theme: Partial<Theme>): Promise<Theme> {
        const sanitized = sanitizeTheme(theme);
        const createdData = await ApiClient.post(end_point, sanitized);
        return createdData as Theme;
    },

    async getThemes(options: GetThemesOptions): Promise<Theme[]> {
        const query = new URLSearchParams();
        if (options.type) query.append("type", options.type);
        if (options.parent) query.append("parent", options.parent);
        if (options.directorate) query.append("directorate", options.directorate);

        const data = await ApiClient.get(`${end_point}?${query.toString()}`);
        return data as Theme[];
    },


    async updateTheme(theme: Partial<Theme>): Promise<Theme> {
        if (!theme._id) {
            throw new Error("_id required.");
        }
        const url = `${end_point}/${theme._id}`;
        const sanitized = sanitizeTheme(theme);
        const updatedTheme = await ApiClient.put(url, sanitized);
        return updatedTheme as Theme;
    },

    async deleteTheme(theme: Partial<Theme>): Promise<boolean> {
        if (!theme._id) {
            throw new Error("_id required.");
        }
        const url = `${end_point}/${theme._id}`;
        const response = await ApiClient.delete(url);
        return response;
    },
};
