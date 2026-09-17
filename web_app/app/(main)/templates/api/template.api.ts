import { EntityApi } from "@/api/EntityApi";
import { ApiClient } from "@/api/ApiClient";
import { Template } from "../models/template.model";
import { sanitize } from "@/utils/utils";


export const TemplateApi: EntityApi<Template> = {

    async getAll() {
        return ApiClient.get('/templates/');
    },

    async lookup() {
        return ApiClient.get('/templates/lookup');
    },


    async create(template) {
        const sanitized = sanitize(template);

        return ApiClient.post(
            '/templates/',
            sanitized
        );
    },


    async update(template) {
        if (!template._id) {
            throw new Error("_id required");
        }

        return ApiClient.put(
            `/templates/${template._id}`,
            sanitize(template)
        );
    },


    async delete(template) {
        if (!template._id) {
            throw new Error("_id required");
        }

        return ApiClient.delete(
            `/templates/${template._id}`
        );
    }
};