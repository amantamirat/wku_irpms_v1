import { EntityApi } from "@/api/EntityApi";
import { ApiClient } from "@/api/ApiClient";
import { FilterThemes, Theme } from "../models/theme.model";
import { sanitize } from "@/utils/utils";

const end_point = '/thematics/themes';

export const ThemeApi: EntityApi<Theme, FilterThemes> = {

    async getAll(options?: FilterThemes) {
        return ApiClient.get(end_point, options);
    },

    async getById(
        id: string
    ): Promise<Theme> {
        const data = await ApiClient.get(`${end_point}/${id}`);
        return data as Theme;
    },

    async lookup(options?: FilterThemes) {
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
    }
};