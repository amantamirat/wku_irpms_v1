import { EntityApi } from "@/api/EntityApi";
import { ApiClient } from "@/api/ApiClient";
import { sanitize } from "@/utils/utils";
import { IDocumentTemplate } from "../models/documentTemplate.model";

const end_point = "/documentTemplates";

export const DocumentTemplateApi: EntityApi<IDocumentTemplate> & {
    generate(phaseId: string): Promise<any>;
} = {

    async getAll() {
        return ApiClient.get(end_point);
    },

    async create(temp: Partial<IDocumentTemplate>): Promise<any> {
        const formData = new FormData();

        // 1. Append the actual template file
        if (temp.file) {
            formData.append("file", temp.file);
        }

        // 2. Remove file before sanitizing metadata
        const { file, ...templateWithoutFile } = temp;
        const sanitized = sanitize(templateWithoutFile);

        // 3. Append metadata as JSON
        formData.append(
            "documentTemplate",
            JSON.stringify(sanitized)
        );

        return ApiClient.post(end_point, formData);
    },

    async generate(phaseId) {
        return ApiClient.get(`${end_point}/${phaseId}/generate`);
    },

    async getById(id: string) {
        return ApiClient.get(`${end_point}/${id}`);
    },

    async update(temp) {
        if (!temp._id) throw new Error("_id required");

        return ApiClient.put(
            `${end_point}/${temp._id}`,
            sanitize(temp)
        );
    },

    async delete(temp) {
        if (!temp._id) throw new Error("_id required");

        return ApiClient.delete(`${end_point}/${temp._id}`);
    }
};