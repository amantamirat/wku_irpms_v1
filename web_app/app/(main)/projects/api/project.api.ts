import { ApiClient } from "@/api/ApiClient";
import { Project } from "../models/project.model";
const end_point = '/projects/';


export const ProjectApi = {
    
    async getProjects(): Promise<Project[]> {
        const data = await ApiClient.get(end_point);
        return data as Project[];
    },

    async createProject(project: Partial<Project>): Promise<Project> {
        const createdData = await ApiClient.post(end_point, project);
        return createdData as Project;
    },

    async updateProject(project: Partial<Project>): Promise<Project> {
        if (!project._id) {
            throw new Error("_id required.");
        }
        const url = `${end_point}${project._id}`;
        const updatedProject = await ApiClient.put(url, project);
        return updatedProject as Project;
    },

    async deleteProject(project: Partial<Project>): Promise<boolean> {
        if (!project._id) {
            throw new Error("_id required.");
        }
        const url = `${end_point}${project._id}`;
        const response = await ApiClient.delete(url);
        return response;
    },
};
