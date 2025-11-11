import { ApiClient } from "@/api/ApiClient";
import { ProjectStage, sanitizeProjectStage } from "../models/stage.model";
const end_point = '/project/stages/';




export interface GetProjectStageOptions {
    project?: string;
    stage?: string;
    status?: string;
}

export const ProjectStageApi = {

    async getProjectStages(options: GetProjectStageOptions): Promise<ProjectStage[]> {
        const query = new URLSearchParams();
        if (options.project) query.append("project", options.project);
        if (options.stage) query.append("stage", options.stage);
        if (options.status) query.append("status", options.status);
        const data = await ApiClient.get(`${end_point}?${query.toString()}`);
        return data as ProjectStage[];
    },

    async createProjectStage(projectStage: Partial<ProjectStage>): Promise<ProjectStage> {
        const sanitized = sanitizeProjectStage(projectStage);
        const formData = new FormData();
        formData.append("project", sanitized.project as string);
        formData.append("stage", sanitized.stage as string);
        if (projectStage.file)
            formData.append("document", projectStage.file);
        const createdData = await ApiClient.post(end_point, formData);
        return createdData as ProjectStage;
    },

    async updateProjectStage(projectStage: Partial<ProjectStage>): Promise<ProjectStage> {
        if (!projectStage._id) {
            throw new Error("_id required.");
        }
        const url = `${end_point}${projectStage._id}`;
        const updatedProjectStage = await ApiClient.put(url, sanitizeProjectStage(projectStage));
        return updatedProjectStage as ProjectStage;
    },

    async deleteProjectStage(projectStage: Partial<ProjectStage>): Promise<boolean> {
        if (!projectStage._id) {
            throw new Error("_id required.");
        }
        const url = `${end_point}${projectStage._id}`;
        const response = await ApiClient.delete(url);
        return response;
    },
};
