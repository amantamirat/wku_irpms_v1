import { ApiClient } from "@/api/ApiClient";
import { DocStatus, GetProjectStageOptions, ProjectDoc, sanitizeProjectDoc, sanitizeUpdateStatusDTO, UpdateStatusDTO } from "../models/document.model";

const end_point = '/project/documents';

export const ProjectDocApi = {

    async getProjectDocs(options: GetProjectStageOptions): Promise<ProjectDoc[]> {
        const query = new URLSearchParams();
        const sanitized = sanitizeProjectDoc(options);
        if (sanitized.project) query.append("project", sanitized.project as string);
        if (sanitized.stage) query.append("stage", sanitized.stage as string);
        //if (options.status) query.append("status", options.status);
        const data = await ApiClient.get(`${end_point}?${query.toString()}`);
        return data as ProjectDoc[];
    },

    async createProjectStage(projectStage: Partial<ProjectDoc>): Promise<any> {
        const sanitized = sanitizeProjectDoc(projectStage);
        const formData = new FormData();
        formData.append("project", sanitized.project as string);
        formData.append("stage", sanitized.stage as string);
        if (projectStage.file)
            formData.append("document", projectStage.file);
        const createdData = await ApiClient.post(end_point, formData);
        return createdData;
    },

    async updateStatus(dto: Partial<UpdateStatusDTO>, status: DocStatus): Promise<any> {
        const sanitized = sanitizeUpdateStatusDTO(dto);
        const url = `${end_point}`;
        const updated = await ApiClient.patch(url, { ...sanitized, status });
        return updated;
    },

    /*
        async updateStatus(dto: Partial<UpdateStatusDTO>, status: DocStatus): Promise<ProjectDoc> {
            const query = new URLSearchParams();
            query.append("id", id);
            const url = `${end_point}/${status}`;
            const updated = await ApiClient.put(`${url}?${query.toString()}`);
            return updated as ProjectDoc;
        },
        */

    /*
    async updateProjectStage(projectStage: Partial<ProjectDoc>): Promise<ProjectDoc> {
        if (!projectStage._id) {
            throw new Error("_id required.");
        }
        const url = `${end_point}${projectStage._id}`;
        const updatedProjectStage = await ApiClient.put(url, sanitizeProjectStage(projectStage));
        return updatedProjectStage as ProjectDoc;
    },
    */

    async deleteProjectStage(projectStage: Partial<ProjectDoc>): Promise<any> {
        if (!projectStage._id) {
            throw new Error("_id required.");
        }
        const url = `${end_point}/${projectStage._id}`;
        const response = await ApiClient.delete(url);
        return response;
    },
};
