import { EntityApi } from "@/api/EntityApi";
import { ApiClient } from "@/api/ApiClient";
import { FilterThemesOptions, Theme } from "../models/theme.model";
import { sanitize } from "@/utils/sanitizer";

const end_point = '/thematics/themes';

export const ThemeApi: EntityApi<Theme, FilterThemesOptions> = {

    async getAll(options?: FilterThemesOptions) {
        return ApiClient.get(end_point, options);
    },

    async lookup(options?: FilterThemesOptions) {
        return ApiClient.get(`${end_point}/lookup`, options);
    },

    async create(theme) {
        const sanitized = sanitize(theme);
        return ApiClient.post(end_point, sanitized);
    },

    async update(theme) {
        if (!theme._id) throw new Error("_id required");
        const sanitized = sanitize(theme);
        return ApiClient.put(`${end_point}/${theme._id}`, sanitized);
    },

    async delete(theme) {
        if (!theme._id) throw new Error("_id required");
        return ApiClient.delete(`${end_point}/${theme._id}`);
    },

    /*
    async import(formData: FormData, thematicId?: string) {
        return ApiClient.post(`${end_point}/import/${thematicId}`, formData);
    }*/
};