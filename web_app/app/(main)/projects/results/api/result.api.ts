import { ApiClient } from "@/api/ApiClient";
import { Result, sanitizeResult } from "../models/result.model";

const end_point = '/project/results/';

export interface GetResultOptions {
    criterion?: string;
    evaluator?: string;
}

export const ResultApi = {
    async getResults(options: GetResultOptions): Promise<Result[]> {
        const query = new URLSearchParams();
        if (options.criterion) query.append("criterion", options.criterion);
        if (options.evaluator) query.append("evaluator", options.evaluator);
        const data = await ApiClient.get(`${end_point}?${query.toString()}`);
        return data as Result[];
    },

    async createResult(result: Partial<Result>): Promise<Result> {
        const createdData = await ApiClient.post(end_point, sanitizeResult(result));
        return createdData as Result;
    },

    async updateResult(result: Partial<Result>): Promise<Result> {
        if (!result._id) {
            throw new Error("_id required.");
        }
        const url = `${end_point}${result._id}`;
        const updatedResult = await ApiClient.put(url, sanitizeResult(result));
        return updatedResult as Result;
    },

    async deleteResult(result: Partial<Result>): Promise<boolean> {
        if (!result._id) {
            throw new Error("_id required.");
        }
        const url = `${end_point}${result._id}`;
        const response = await ApiClient.delete(url);
        return response;
    },
};
