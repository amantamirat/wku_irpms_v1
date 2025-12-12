import { ApiClient } from "@/api/ApiClient";
import { GetProjectsOptions, Project, sanitizeGetProjectsOptions, sanitizeProject } from "../models/project.model";
const end_point = '/projects';




export const ProjectApi = {

    async getProjects(options: GetProjectsOptions): Promise<Project[]> {
        // Sanitize the options first
        const sanitizedOptions = sanitizeGetProjectsOptions(options);
        const query = new URLSearchParams();
        if (sanitizedOptions.call) query.append("call", sanitizedOptions.call as string);
        const data = await ApiClient.get(`${end_point}?${query.toString()}`);
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
        const url = `${end_point}submit`;
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


