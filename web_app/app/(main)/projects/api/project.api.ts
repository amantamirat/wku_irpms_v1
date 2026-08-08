import { EntityApi } from "@/api/EntityApi";
import { ApiClient } from "@/api/ApiClient";
import { GetProjectsOptions, Project, sanitize } from "../models/project.model";
import { TransitionRequestDto } from "@/types/util";

const end_point = "/projects";

interface IProjectApi extends EntityApi<Project, GetProjectsOptions | undefined> {
    transitionState: (id: string, dto: TransitionRequestDto) => Promise<Project>;
}

export const ProjectApi: IProjectApi = {

    async getAll(options?: GetProjectsOptions): Promise<Project[]> {
        const query = new URLSearchParams();

        if (options) {
            const sanitized = sanitize(options);
            Object.entries(sanitized).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    query.append(key, String(value));
                }
            });
        }

        const url = query.toString()
            ? `${end_point}?${query.toString()}`
            : end_point;

        const data = await ApiClient.get(url);
        return data as Project[];
    },

    async getById(
        id: string,
        populate?: boolean
    ): Promise<Project> {
        const query = populate !== undefined
            ? `?populate=${populate}`
            : '';
        const url = `${end_point}/${id}${query}`;
        const data = await ApiClient.get(url);
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