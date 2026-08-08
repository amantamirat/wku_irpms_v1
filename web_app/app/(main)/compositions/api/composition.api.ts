import { ApiClient } from "@/api/ApiClient";
import { Composition, sanitizeComposition } from "../models/composition.model";
import { EntityApi } from "@/api/EntityApi";

const end_point = '/compositions';
export const CompositionApi: EntityApi<Composition> = {
    
    async create(composition: Partial<Composition>): Promise<Composition> {
        const sanitized = sanitizeComposition(composition);
        const createdData = await ApiClient.post(end_point, sanitized);
        return createdData as Composition;
    },

    async getById(id: string, populate?: boolean): Promise<Composition> {
        const query = populate !== undefined ? `?populate=${populate}` : '';
        return ApiClient.get(`${end_point}/${id}${query}`);
    },

    async getAll(populate): Promise<Composition[]> {
        const query = new URLSearchParams();
        if (populate) query.append("populate", String(populate));
        const data = await ApiClient.get(`${end_point}?${query.toString()}`);
        return data as Composition[];
    },

    async update(composition: Partial<Composition>): Promise<Composition> {
        if (!composition._id) {
            throw new Error("_id required.");
        }
        const url = `${end_point}/${composition._id}`;
        const sanitized = sanitizeComposition(composition);
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