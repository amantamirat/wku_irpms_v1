import { ApiClient } from "@/api/ApiClient";
import { EntityApi } from "@/api/EntityApi";
import { sanitize } from "@/utils/utils";
import { Publication, FilterPublications } from "../models/publication.model";

const end_point = "/publications";
export const PublicationApi: EntityApi<Publication, FilterPublications | undefined> = {

    async getAll(options) {
        return ApiClient.get(end_point, options);
    },

    async lookup(options) {
        return ApiClient.get(`${end_point}/lookup`, options);
    },

    async getById(id: string) {
        return ApiClient.get(`${end_point}/${id}`);
    },


    async create(publication) {
        const sanitized = sanitize(publication)
        return ApiClient.post('/publications/', sanitized)
    },

    async update(publication) {
        if (!publication._id) throw new Error("_id required")
        return ApiClient.put(`/publications/${publication._id}`, sanitize(publication))
    },

    /*
    async transitionState(id: string, dto: StateTransition): Promise<any> {
        const query = new URLSearchParams();
        query.append("id", id);
        const url = `/publications/${id}`;
        const updated = await ApiClient.patch(url, dto);
        return updated;
    },
*/
    async delete(publication) {
        if (!publication._id) throw new Error("_id required")
        return ApiClient.delete(`/publications/${publication._id}`)
    }
}