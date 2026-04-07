import { ApiClient } from "@/api/ApiClient";
import { Composition, GetCompositionsOptions, sanitizeComposition } from "../models/composition.model";
import { EntityApi } from "@/api/EntityApi";

const end_point = '/grants/compositions';
export const CompositionApi: EntityApi<Composition, GetCompositionsOptions | undefined> = {
    async create(composition: Partial<Composition>): Promise<Composition> {
        const sanitized = sanitizeComposition(composition);
        const createdData = await ApiClient.post(end_point, sanitized);
        return createdData as Composition;
    },

    async getAll(options: GetCompositionsOptions): Promise<Composition[]> {
        const sanitized = sanitizeComposition(options);
        const query = new URLSearchParams();
        if (options.grant) query.append("grant", sanitized.grant as string);
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