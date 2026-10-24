import { ApiClient } from "@/api/ApiClient";
import { FilterResultsOptions, Result } from "../models/result.model";
import { EntityApi } from "@/api/EntityApi";
import { sanitize } from "@/utils/utils";

const end_point = '/project/results';

export const ResultApi: EntityApi<Result, FilterResultsOptions | undefined> = {

    async getAll(filter?: FilterResultsOptions): Promise<Result[]> {
        const data = await ApiClient.get(end_point, filter);
        return data as Result[];
    },

    async create(result: Partial<Result>): Promise<Result> {
        const created = await ApiClient.post(end_point, sanitize(result));
        return created as Result;
    },

    async update(result: Partial<Result>): Promise<Result> {
        if (!result._id) throw new Error("_id required.");        
        const url = `${end_point}/${result._id}`;
        const updated = await ApiClient.put(url, sanitize(result));
        return updated as Result;
    },

    async delete(result: Partial<Result>): Promise<boolean> {
        // if (!result._id) {throw new Error("_id required.");}
        const url = `${end_point}/${result._id}`;
        const deleted = await ApiClient.delete(url);
        return deleted;
    },
};
