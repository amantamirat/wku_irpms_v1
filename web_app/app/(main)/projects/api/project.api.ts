import { EntityApi } from "@/api/EntityApi";
import { ApiClient } from "@/api/ApiClient";
import { FilterProjects, Project } from "../models/project.model";
import { TransitionRequestDto } from "@/types/util";
import { sanitize } from "@/utils/sanitizer";

const end_point = "/projects";

interface IProjectApi extends EntityApi<Project, FilterProjects | undefined> {
    transitionState: (id: string, dto: TransitionRequestDto) => Promise<Project>;
    me: (filter?: FilterProjects) => Promise<Project[]>;
}

export const ProjectApi: IProjectApi = {

    async getAll(filter?: FilterProjects): Promise<Project[]> {
        const data = await ApiClient.get(end_point, filter);
        return data as Project[];
    },

    async me(filter?: FilterProjects): Promise<Project[]> {
        const data = await ApiClient.get(`${end_point}/me`, filter);
        return data as Project[];
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

    async transitionState(id: string, dto: TransitionRequestDto): Promise<Project> {
        // Matches the pattern: PATCH /projects/:id
        const url = `${end_point}/${id}`;
        const updated = await ApiClient.patch(url, dto);
        return updated as Project;
    }
};