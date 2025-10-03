import { ApiClient } from "@/api/ApiClient";
import { Project, sanitizeProject } from "../models/project.model";
const end_point = '/projects';

export const ProjectApi = {

    async getProjects(): Promise<Project[]> {
        const data = await ApiClient.get(end_point);
        return data as Project[];
    },

    async createProject(project: Partial<Project>): Promise<Project> {
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
        const submittedData = await ApiClient.post(url, formData);
        return submittedData as Project;
    },

    async updateProject(project: Partial<Project>): Promise<Project> {
        if (!project._id) {
            throw new Error("_id required.");
        }
        const sanitized = sanitizeProject(project);
        const url = `${end_point}/${project._id}`;
        const updatedProject = await ApiClient.put(url, sanitized);
        return updatedProject as Project;
    },

    async deleteProject(project: Partial<Project>): Promise<boolean> {
        if (!project._id) {
            throw new Error("_id required.");
        }
        const url = `${end_point}/${project._id}`;
        const response = await ApiClient.delete(url);
        return response;
    },
};


