import { EntityApi } from "@/api/EntityApi";
import { ApiClient } from "@/api/ApiClient";
import { Template, sanitizeTemplate } from "../models/template.model";


export const TemplateApi: EntityApi<Template> = {

    async getAll() {
        return ApiClient.get('/templates/');
    },


    async create(template) {
        const sanitized = sanitizeTemplate(template);

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
            sanitizeTemplate(template)
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