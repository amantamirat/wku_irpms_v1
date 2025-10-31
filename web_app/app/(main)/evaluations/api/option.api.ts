import { ApiClient } from "@/api/ApiClient";
import { Option } from "../models/option.model";
import { Criterion } from "../models/criterion.model";

const end_point = '/options';

function sanitizeOption(option: Partial<Option>): Partial<Option> {
    return {
        ...option,
        criterion:
            typeof option.criterion === 'object' && option.criterion !== null
                ? (option.criterion as Criterion)._id
                : option.criterion
    };
}

export interface GetOptionsFilter {
    criterion?: string;
}

export const OptionApi = {

    async createOption(option: Partial<Option>): Promise<Option> {
        const sanitized = sanitizeOption(option);
        const createdData = await ApiClient.post(end_point, sanitized);
        return createdData as Option;
    },

    async getOptions(filter: GetOptionsFilter = {}): Promise<Option[]> {
        const query = new URLSearchParams();
        if (filter.criterion) query.append("criterion", filter.criterion);
        const data = await ApiClient.get(`${end_point}?${query.toString()}`);
        return data as Option[];
    },

    async updateOption(option: Partial<Option>): Promise<Option> {
        if (!option._id) {
            throw new Error("_id required.");
        }
        const url = `${end_point}/${option._id}`;
        const sanitized = sanitizeOption(option);
        const updatedData = await ApiClient.put(url, sanitized);
        return updatedData as Option;
    },

    async deleteOption(option: Partial<Option>): Promise<boolean> {
        if (!option._id) {
            throw new Error("_id required.");
        }
        const url = `${end_point}/${option._id}`;
        const response = await ApiClient.delete(url);
        return response;
    },
};
