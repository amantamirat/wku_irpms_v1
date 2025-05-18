import { Theme } from "@/models/theme";
import { MyService } from "./MyService";
import { Directorate } from "@/models/directorate";

const end_point = '/themes/';


export const ThemeService = {

    async getThemes(): Promise<Theme[]> {
        const data = await MyService.get(end_point);
        return data as Theme[];
    },

    async getThemesByDirectorate(directorate: Directorate): Promise<Theme[]> {
        if (!directorate._id) {
            throw new Error("_id required.");
        }
        const data = await MyService.get(`${end_point}directorate/${directorate._id}`);
        return data as Theme[];
    },

    async createTheme(theme: Partial<Theme>): Promise<Theme> {
        const createdData = await MyService.post(end_point, theme);
        return createdData as Theme;
    },

    async updateTheme(theme: Partial<Theme>): Promise<Theme> {
        if (!theme._id) {
            throw new Error("_id required.");
        }
        const url = `${end_point}${theme._id}`;
        const updatedTheme = await MyService.put(url, theme);
        return updatedTheme as Theme;
    },

    async deleteTheme(theme: Partial<Theme>): Promise<boolean> {
        if (!theme._id) {
            throw new Error("_id required.");
        }
        const url = `${end_point}${theme._id}`;
        const response = await MyService.delete(url);
        return response;
    },
};
