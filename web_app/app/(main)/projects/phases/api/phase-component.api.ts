import { ApiClient } from "@/api/ApiClient";
import type { EntityApi } from "@/api/EntityApi";
import { sanitize } from "@/utils/utils";
import type {
    FilterProjectComponents,
    ProjectComponent
} from "../models/phase-component.model";

const endpoint = "/project/components";

export const ProjectComponentApi: EntityApi<
    ProjectComponent,
    FilterProjectComponents | undefined
> & {
    getByPhase(phase: string): Promise<ProjectComponent[]>;
    getByProject(project: string): Promise<ProjectComponent[]>;
} = {
    async getAll(filter?: FilterProjectComponents): Promise<ProjectComponent[]> {
        return ApiClient.get(endpoint, filter) as Promise<ProjectComponent[]>;
    },

    async lookup(filter?: FilterProjectComponents): Promise<ProjectComponent[]> {
        return ApiClient.get(`${endpoint}/lookup`, filter) as Promise<ProjectComponent[]>;
    },

    async getByPhase(phase: string): Promise<ProjectComponent[]> {
        return ApiClient.get(`${endpoint}/lookup`, { phase }) as Promise<ProjectComponent[]>;
    },

    async getByProject(project: string): Promise<ProjectComponent[]> {
        return ApiClient.get(`${endpoint}/lookup`, { project }) as Promise<ProjectComponent[]>;
    },

    async create(component: Partial<ProjectComponent>): Promise<ProjectComponent> {
        return ApiClient.post(endpoint, sanitize(component)) as Promise<ProjectComponent>;
    },

    async update(component: Partial<ProjectComponent>): Promise<ProjectComponent> {
        if (!component._id) throw new Error("_id required");
        return ApiClient.put(
            `${endpoint}/${component._id}`,
            sanitize(component)
        ) as Promise<ProjectComponent>;
    },

    async delete(component: Partial<ProjectComponent>): Promise<boolean> {
        if (!component._id) throw new Error("_id required");
        return ApiClient.delete(`${endpoint}/${component._id}`);
    },
};
