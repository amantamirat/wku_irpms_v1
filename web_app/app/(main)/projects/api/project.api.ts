import { EntityApi } from "@/api/EntityApi";
import { ApiClient } from "@/api/ApiClient";
import { FilterProjects, Project } from "../models/project.model";
import { StateTransition } from "@/api/EntityApi";
import { sanitize } from "@/utils/utils";

const end_point = "/projects";

interface IProjectApi extends EntityApi<Project, FilterProjects | undefined> {
    transitionState: (id: string, dto: StateTransition) => Promise<Project>;
    me: (filter?: FilterProjects) => Promise<Project[]>;
    apply: (project: Partial<Project>) => Promise<any>;
    getProgress: (id: string) => Promise<any>
}

export const ProjectApi: IProjectApi = {

    async getAll(filter?: FilterProjects): Promise<Project[]> {
        const data = await ApiClient.get(end_point, filter);
        return data as Project[];
    },

    async lookup(options) {
        return ApiClient.get(`${end_point}/lookup`, options);
    },

    async me(filter?: FilterProjects): Promise<Project[]> {
        const data = await ApiClient.get(`${end_point}/me`, filter);
        return data as Project[];
    },

    async getProgress(id: string): Promise<any> {
        const data = await ApiClient.get(`${end_point}/${id}/progress`);
        return data;
    },

    async getById(
        id: string
    ): Promise<Project> {
        const data = await ApiClient.get(`${end_point}/${id}`);
        return data as Project;
    },
    async create(project: Partial<Project>): Promise<Project> {
        const sanitized = sanitize(project);
        const createdData = await ApiClient.post(end_point, sanitized);
        return createdData as Project;
    },

    async apply(project: Partial<Project>): Promise<any> {
        const formData = new FormData();

        // 1. Append the real file directly
        if (project.file) {
            formData.append("file", project.file);
        }

        // 2. Separate file out so sanitize only handles text/metadata
        const { file, ...projectWithoutFile } = project;
        const sanitized = sanitize(projectWithoutFile);

        // 3. Stringify clean metadata
        formData.append("project", JSON.stringify(sanitized));

        return ApiClient.post(`${end_point}/apply`, formData);
    },

    async update(project: Partial<Project>): Promise<Project> {
        if (!project._id) throw new Error("_id required");
        const sanitized = sanitize(project);
        const updatedProject = await ApiClient.put(`${end_point}/${project._id}`, sanitized);
        return updatedProject as Project;
    },

    async delete(project: Partial<Project>): Promise<boolean> {
        if (!project._id) throw new Error("_id required");
        const url = `${end_point}/${project._id}`;
        return await ApiClient.delete(url);
    },

    async transitionState(id: string, dto: StateTransition): Promise<Project> {
        // Matches the pattern: PATCH /projects/:id
        const url = `${end_point}/${id}`;
        const updated = await ApiClient.patch(url, dto);
        return updated as Project;
    }
};