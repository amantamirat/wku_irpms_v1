import { ApiClient } from "@/api/ApiClient";
import { HistoryRule, sanitizeHistoryRule } from "../models/history.model";
import { EntityApi } from "@/api/EntityApi";

const end_point = '/team/histories';
export const HistoryApi: EntityApi<HistoryRule> = {
    async create(HistoryRule: Partial<HistoryRule>): Promise<HistoryRule> {
        const sanitized = sanitizeHistoryRule(HistoryRule);
        const createdData = await ApiClient.post(end_point, sanitized);
        return createdData as HistoryRule;
    },

    async getById(id: string, populate?: boolean): Promise<HistoryRule> {
        const query = populate !== undefined ? `?populate=${populate}` : '';
        return ApiClient.get(`${end_point}/${id}${query}`);
    },

    async getAll(populate): Promise<HistoryRule[]> {
        const query = new URLSearchParams();
        if (populate) query.append("populate", String(populate));
        const data = await ApiClient.get(`${end_point}?${query.toString()}`);
        return data as HistoryRule[];
    },

    async update(HistoryRule: Partial<HistoryRule>): Promise<HistoryRule> {
        if (!HistoryRule._id) {
            throw new Error("_id required.");
        }
        const url = `${end_point}/${HistoryRule._id}`;
        const sanitized = sanitizeHistoryRule(HistoryRule);
        const updatedHistoryRule = await ApiClient.put(url, sanitized);
        return updatedHistoryRule as HistoryRule;
    },

    async delete(data: Partial<HistoryRule>): Promise<boolean> {
        if (!data._id) {
            throw new Error("_id required.");
        }
        const url = `${end_point}/${data._id}`;
        const response = await ApiClient.delete(url);
        return response;
    },
};