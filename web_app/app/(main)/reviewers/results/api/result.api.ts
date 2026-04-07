import { ApiClient } from "@/api/ApiClient";
import { GetResultsOptions, Result, sanitizeResult } from "../models/result.model";
import { EntityApi } from "@/api/EntityApi";

const end_point = '/project/results';

export const ResultApi: EntityApi<Result, GetResultsOptions | undefined> = {

    async getAll(options?: GetResultsOptions): Promise<Result[]> {
        const query = new URLSearchParams();
        if (options) {
            const sanitized = sanitizeResult(options);
            query.append("reviewer", sanitized.reviewer as string);
            if (options.populate !== undefined) {
                query.append("populate", String(options.populate));
            }
        }

        const url = query.toString()
            ? `${end_point}?${query.toString()}`
            : end_point;

        const data = await ApiClient.get(url);
        return data as Result[];
    },

    async create(result: Partial<Result>): Promise<Result> {
        const created = await ApiClient.post(end_point, sanitizeResult(result));
        return created as Result;
    },

    async update(result: Partial<Result>): Promise<Result> {
        //if (!result._id) throw new Error("_id required.");        
        const url = `${end_point}/${result._id}`;
        const updated = await ApiClient.put(url, sanitizeResult(result));
        return updated as Result;
    },

    async delete(result: Partial<Result>): Promise<boolean> {
        // if (!result._id) {throw new Error("_id required.");}
        const url = `${end_point}/${result._id}`;
        const deleted = await ApiClient.delete(url);
        return deleted;
    },
};
