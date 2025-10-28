import { ApiClient } from "@/api/ApiClient";
import { Composition } from "../models/composition.model";

const end_point = '/grants/compositions';

function sanitizeComposition(composition: Partial<Composition>): Partial<Composition> {
    return {
        ...composition,
        constraint:
            typeof composition.constraint === 'object' && composition.constraint !== null
                ? (composition.constraint as any)._id
                : composition.constraint
    };
}

export interface GetCompositionsOptions {
    constraint?: string;
}

export const CompositionApi = {
    async createComposition(composition: Partial<Composition>): Promise<Composition> {
        const sanitized = sanitizeComposition(composition);
        const createdData = await ApiClient.post(end_point, sanitized);
        return createdData as Composition;
    },

    async getCompositions(options: GetCompositionsOptions): Promise<Composition[]> {
        const query = new URLSearchParams();
        if (options.constraint) query.append("constraint", options.constraint);
        const data = await ApiClient.get(`${end_point}?${query.toString()}`);
        return data as Composition[];
    },

    async updateComposition(composition: Partial<Composition>): Promise<Composition> {
        if (!composition._id) {
            throw new Error("_id required.");
        }
        const url = `${end_point}/${composition._id}`;
        const sanitized = sanitizeComposition(composition);
        const updatedComposition = await ApiClient.put(url, sanitized);
        return updatedComposition as Composition;
    },

    async deleteComposition(composition: Partial<Composition>): Promise<boolean> {
        if (!composition._id) {
            throw new Error("_id required.");
        }
        const url = `${end_point}/${composition._id}`;
        const response = await ApiClient.delete(url);
        return response;
    },
};
