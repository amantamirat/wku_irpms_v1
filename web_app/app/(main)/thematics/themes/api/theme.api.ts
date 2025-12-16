import { ApiClient } from "@/api/ApiClient";
import { GetThemesOptions, sanitizeTheme, Theme } from "../models/theme.model";

const end_point = '/thematics/themes';

export const ThemeApi = {

    async createTheme(theme: Partial<Theme>): Promise<Theme> {
        const sanitized = sanitizeTheme(theme);
        const createdData = await ApiClient.post(end_point, sanitized);
        return createdData as Theme;
    },

    async getThemes(options: GetThemesOptions): Promise<Theme[]> {
        const query = new URLSearchParams();
        const sanitized = sanitizeTheme(options);
        if (options.parent) query.append("parent", sanitized.parent as string);
        if (options.thematicArea) query.append("thematicArea", sanitized.thematicArea as string);
        if (options.level !== undefined)
            query.append("level", String(sanitized.level));
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

    async importThemes(thematicAreaId: string, themesData: any[]): Promise<any> {
        const response = await ApiClient.post(`${end_point}/import`, {
            thematicAreaId,
            themesData
        });
        return response;
    },

};
