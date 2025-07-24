import { Theme } from "@/models/theme/theme";
import { MyService } from "../MyService";
import { Organization } from "@/models/organization";


const end_point = '/themes';

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


export const ThemeService = {

    async createTheme(theme: Partial<Theme>): Promise<Theme> {
        const sanitized = sanitizeTheme(theme);
        const createdData = await MyService.post(end_point, sanitized);
        return createdData as Theme;
    },

    async getThemesByDirectorate(directorate: string): Promise<Theme[]> {
        const data = await MyService.get(`${end_point}/directorate/${directorate}`);
        return data as Theme[];
    },

    async getThemesByParent(parent: string): Promise<Theme[]> {
        const data = await MyService.get(`${end_point}/parent/${parent}`);
        return data as Theme[];
    },

    async updateTheme(theme: Partial<Theme>): Promise<Theme> {
        if (!theme._id) {
            throw new Error("_id required.");
        }
        const url = `${end_point}/${theme._id}`;
        const sanitized = sanitizeTheme(theme);
        const updatedTheme = await MyService.put(url, sanitized);
        return updatedTheme as Theme;
    },

    async deleteTheme(theme: Partial<Theme>): Promise<boolean> {
        if (!theme._id) {
            throw new Error("_id required.");
        }
        const url = `${end_point}/${theme._id}`;
        const response = await MyService.delete(url);
        return response;
    },
};
