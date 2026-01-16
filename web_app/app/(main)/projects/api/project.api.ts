import { ApiClient } from "@/api/ApiClient";
import { GetProjectsOptions, Project, ProjectStatus, sanitizeProject } from "../models/project.model";

const end_point = '/projects';

export const ProjectApi = {

    async getProjects(options: GetProjectsOptions): Promise<Project[]> {
        // Sanitize the options first
        const sanitized = sanitizeProject(options);
        const query = new URLSearchParams();
        if (sanitized.call) query.append("call", sanitized.call as string);
        if (sanitized.applicant) query.append("leadPI", sanitized.applicant as string);
        const data = await ApiClient.get(`${end_point}?${query.toString()}`);
        return data as Project[];
    },


    async create(project: Partial<Project>): Promise<Project> {
        const sanitized = sanitizeProject(project);
        const createdData = await ApiClient.post(end_point, sanitized);
        return createdData as Project;
    },

    async submitProject(project: Partial<Project>): Promise<Project> {
        if (!project.file)
            throw new Error("File required.");
        const sanitized = sanitizeProject(project);
        const url = `${end_point}/submit`;
        const formData = new FormData();
        formData.append("project", JSON.stringify(sanitized));
        formData.append("document", project.file);
        const submitted = await ApiClient.post(url, formData);
        return submitted as Project;
    },

    async update(project: Partial<Project>): Promise<Project> {
        if (!project._id) throw new Error("_id required.");
        const query = new URLSearchParams();
        query.append("id", project._id);
        const sanitized = sanitizeProject(project);
        const updatedProject = await ApiClient.put(`${end_point}?${query.toString()}`, sanitized);
        return updatedProject as Project;
    },

    async updateStatus(id: string, status: ProjectStatus): Promise<Project> {
        const query = new URLSearchParams();
        query.append("id", id);
        const url = `${end_point}/${status}`;
        const updated = await ApiClient.put(`${url}?${query.toString()}`);
        return updated as Project;
    },

    async delete(project: Partial<Project>): Promise<boolean> {
        if (!project._id) throw new Error("_id required.");
        const url = `${end_point}/${project._id}`;
        const response = await ApiClient.delete(url);
        return response;
    },
};


