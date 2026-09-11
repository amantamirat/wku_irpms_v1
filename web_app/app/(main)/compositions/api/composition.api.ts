import { ApiClient } from "@/api/ApiClient";
import { Composition } from "../models/composition.model";
import { EntityApi } from "@/api/EntityApi";
import { sanitize } from "@/utils/utils";

const end_point = '/compositions';
export const CompositionApi: EntityApi<Composition> = {

    async create(composition: Partial<Composition>): Promise<Composition> {
        const sanitized = sanitize(composition);
        const createdData = await ApiClient.post(end_point, sanitized);
        return createdData as Composition;
    },

    async getById(id: string): Promise<Composition> {
        return ApiClient.get(`${end_point}/${id}`);
    },

    async getAll(): Promise<Composition[]> {
        const data = await ApiClient.get(end_point);
        return data as Composition[];
    },

    async update(composition: Partial<Composition>): Promise<Composition> {
        if (!composition._id) {
            throw new Error("_id required.");
        }
        const url = `${end_point}/${composition._id}`;
        const sanitized = sanitize(composition);
        const updatedComposition = await ApiClient.put(url, sanitized);
        return updatedComposition as Composition;
    },

    async delete(composition: Partial<Composition>): Promise<boolean> {
        if (!composition._id) {
            throw new Error("_id required.");
        }
        const url = `${end_point}/${composition._id}`;
        const response = await ApiClient.delete(url);
        return response;
    },
};