import { ApiClient } from "@/api/ApiClient";
import { IHistoryRule } from "../models/history.model";
import { EntityApi } from "@/api/EntityApi";
import { sanitize } from "@/utils/utils";

const end_point = '/team/histories';
export const HistoryApi: EntityApi<IHistoryRule> = {
    async create(HistoryRule: Partial<IHistoryRule>): Promise<IHistoryRule> {
        const sanitized = sanitize(HistoryRule);
        const createdData = await ApiClient.post(end_point, sanitized);
        return createdData as IHistoryRule;
    },

    async getById(id: string): Promise<IHistoryRule> {
        return ApiClient.get(`${end_point}/${id}`);
    },

    async getAll(populate): Promise<IHistoryRule[]> {
        const data = await ApiClient.get(end_point);
        return data as IHistoryRule[];
    },

    async update(HistoryRule: Partial<IHistoryRule>): Promise<IHistoryRule> {
        if (!HistoryRule._id) {
            throw new Error("_id required.");
        }
        const url = `${end_point}/${HistoryRule._id}`;
        const sanitized = sanitize(HistoryRule);
        const updatedHistoryRule = await ApiClient.put(url, sanitized);
        return updatedHistoryRule as IHistoryRule;
    },

    async delete(data: Partial<IHistoryRule>): Promise<boolean> {
        if (!data._id) {
            throw new Error("_id required.");
        }
        const url = `${end_point}/${data._id}`;
        const response = await ApiClient.delete(url);
        return response;
    },
};