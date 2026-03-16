import { EntityApi } from "@/api/EntityApi";
import { ApiClient } from "@/api/ApiClient";
import { GetOptionsFilter, Option, sanitize } from "../models/option.model";

const end_point = '/options';

export const OptionApi: EntityApi<Option, GetOptionsFilter> = {

    async getAll(options?: GetOptionsFilter) {
        const query = new URLSearchParams();

        if (options) {
            const sanitized = sanitize(options);
            if (options.criterion) query.append("criterion", sanitized.criterion as string);
        }

        const url = query.toString() ? `${end_point}?${query.toString()}` : end_point;
        return ApiClient.get(url);
    },

    async create(option) {
        const sanitized = sanitize(option);
        return ApiClient.post(end_point, sanitized);
    },

    async update(option) {
        if (!option._id) throw new Error("_id required");
        const sanitized = sanitize(option);
        return ApiClient.put(`${end_point}/${option._id}`, sanitized);
    },

    async delete(option) {
        if (!option._id) throw new Error("_id required");
        return ApiClient.delete(`${end_point}/${option._id}`);
    },
};