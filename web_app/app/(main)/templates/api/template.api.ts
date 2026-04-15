import { EntityApi } from "@/api/EntityApi";
import { ApiClient } from "@/api/ApiClient";
import {
    Template,
    GetTemplatesOptions,
    sanitizeTemplate
} from "../models/template.model";
import { TransitionRequestDto } from "@/types/util";

const end_point = "/templates";

export const TemplateApi: EntityApi<Template, GetTemplatesOptions | undefined> = {

    async getAll(options) {
        const query = new URLSearchParams();

        if (options) {
            if (options.status) {
                query.append("status", String(options.status));
            }
            if (options.name) {
                query.append("name", options.name);
            }
        }

        const qs = query.toString();
        return ApiClient.get(`${end_point}${qs ? `?${qs}` : ""}`);
    },

    async getById(id: string) {
        if (!id) throw new Error("id required");
        return ApiClient.get(`${end_point}/${id}`);
    },

    async create(template) {
        const sanitized = sanitizeTemplate(template);
        return ApiClient.post(end_point, sanitized);
    },

    async update(template) {
        if (!template._id) throw new Error("_id required");

        const sanitized = sanitizeTemplate(template);
        return ApiClient.put(`${end_point}/${template._id}`, sanitized);
    },

    async delete(template) {
        if (!template._id) throw new Error("_id required");
        return ApiClient.delete(`${end_point}/${template._id}`);
    },

    async transitionState(id: string, dto: TransitionRequestDto): Promise<any> {
        if (!id) throw new Error("id required");

        const url = `${end_point}/${id}`;
        return ApiClient.patch(url, dto);
    }
};