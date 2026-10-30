
import { EntityApi } from "@/api/EntityApi";
import { ApiClient } from "@/api/ApiClient";
import { sanitize } from "@/utils/utils";
import { ProjectComponentDTO, FilterProjectComponents } from "../models/component.model";

const end_point = "/project/components";

export const ProjectComponentApi: EntityApi<
    ProjectComponentDTO,
    FilterProjectComponents | undefined
> = {

    async getAll(options?: FilterProjectComponents): Promise<ProjectComponentDTO[]> {
        const data = await ApiClient.get(end_point, options);
        return data as ProjectComponentDTO[];
    },

    async lookup(options) {
        return ApiClient.get(`${end_point}/lookup`, options);
    },

    async getById(id: string): Promise<ProjectComponentDTO> {
        const url = `${end_point}/${id}`;
        const data = await ApiClient.get(url);
        return data as ProjectComponentDTO;
    },

    async create(component: Partial<ProjectComponentDTO>): Promise<ProjectComponentDTO> {
        const sanitized = sanitize(component);
        const createdData = await ApiClient.post(end_point, sanitized);
        return createdData as ProjectComponentDTO;
    },

    async update(component: Partial<ProjectComponentDTO & { _id: string }>): Promise<ProjectComponentDTO> {
        if (!component._id) throw new Error("_id required");

        const sanitized = sanitize(component);
        const url = `${end_point}/${component._id}`;

        const updatedComponent = await ApiClient.put(url, sanitized);
        return updatedComponent as ProjectComponentDTO;
    },

    async delete(component: Partial<ProjectComponentDTO & { _id: string }>): Promise<boolean> {
        if (!component._id) throw new Error("_id required");

        const url = `${end_point}/${component._id}`;
        return await ApiClient.delete(url);
    },
};
