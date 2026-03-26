import { EntityApi } from "@/api/EntityApi";
import { ApiClient } from "@/api/ApiClient";
import { GetThemesOptions, sanitizeTheme, Theme } from "../models/theme.model";

const end_point = '/thematics/themes';

export const ThemeApi: EntityApi<Theme, GetThemesOptions> = {

    async getAll(options?: GetThemesOptions) {
        const query = new URLSearchParams();

        if (options) {
            const sanitized = sanitizeTheme(options);
            if (options.parent) query.append("parent", sanitized.parent as string);
            if (options.thematicArea) query.append("thematicArea", sanitized.thematicArea as string);
            if (options.level !== undefined)
                query.append("level", String(sanitized.level));
        }

        const url = query.toString()
            ? `${end_point}?${query.toString()}`
            : end_point;

        return ApiClient.get(url);
    },

    async create(theme) {
        const sanitized = sanitizeTheme(theme);
        return ApiClient.post(end_point, sanitized);
    },

    async update(theme) {
        if (!theme._id) throw new Error("_id required");

        const sanitized = sanitizeTheme(theme);
        return ApiClient.put(`${end_point}/${theme._id}`, sanitized);
    },

    async delete(theme) {
        //if (!theme._id) throw new Error("_id required");
        return ApiClient.delete(`${end_point}/${theme._id}`);
    },

    async import(formData: FormData, thematicId?: string) {
        return ApiClient.post(`${end_point}/import/${thematicId}`, formData);
    }
};