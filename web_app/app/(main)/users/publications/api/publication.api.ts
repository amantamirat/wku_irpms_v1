import { ApiClient } from "@/api/ApiClient";
import {
    GetPublicationsOptions,
    Publication,
    sanitizePublication
} from "../models/publication.model";
import { EntityApi } from "@/api/EntityApi";

const endPoint = '/publications';

export const PublicationApi: EntityApi<Publication, GetPublicationsOptions | undefined> = {

    async getAll(options?: GetPublicationsOptions): Promise<Publication[]> {
        const query = new URLSearchParams();
        if (options) {
            const sanitized = sanitizePublication(options);
            if (sanitized.author) query.append("user", sanitized.author as string);
            if (sanitized.type) {
                query.append("type", sanitized.type as string);
            }
        }
        const data = await ApiClient.get(`${endPoint}?${query.toString()}`);
        return data as Publication[];
    },

    async create(publication: Partial<Publication>): Promise<Publication> {
        const sanitized = sanitizePublication(publication);
        const createdData = await ApiClient.post(endPoint, sanitized);
        return createdData as Publication;
    },

    async update(publication: Partial<Publication>): Promise<Publication> {
        if (!publication._id) throw new Error("_id required.");
        const url = `${endPoint}/${publication._id}`;
        const sanitized = sanitizePublication(publication);
        const updatedPublication = await ApiClient.put(url, sanitized);
        return updatedPublication as Publication;
    },

    async delete(publication: Publication): Promise<boolean> {
        if (!publication._id) throw new Error("_id required.");
        const url = `${endPoint}/${publication._id}`;
        const response = await ApiClient.delete(url);
        return response;
    },
};
