import { ApiClient } from "@/api/ApiClient";
import { DocStatus, GetProjectStageOptions, ProjectDoc, sanitizeProjectDoc, sanitizeUpdateStatusDTO, UpdateStatusDTO } from "../models/document.model";
import { Project, sanitize } from "../../models/project.model";

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

    async create(projectStage: Partial<ProjectDoc>): Promise<any> {
        const sanitized = sanitizeProjectDoc(projectStage);
        const formData = new FormData();
        formData.append("project", sanitized.project as string);
        formData.append("stage", sanitized.stage as string);
        if (projectStage.file)
            formData.append("document", projectStage.file);
        const createdData = await ApiClient.post(end_point, formData);
        return createdData;
    },

    async getById(id: string): Promise<ProjectDoc> {
        const url = `${end_point}/${id}`;
        const data = await ApiClient.get(url);
        return data as ProjectDoc;
    },

    async submit(project: Partial<Project>): Promise<any> {
        if (!project.file)
            throw new Error("File required.");
        const sanitized = sanitize(project);
        const url = `${end_point}/submit`;
        const formData = new FormData();
        formData.append("project", JSON.stringify(sanitized));
        formData.append("document", project.file);
        const submitted = await ApiClient.post(url, formData);
        return submitted as Project;
    },

    async updateStatus(dto: Partial<UpdateStatusDTO>, status: DocStatus): Promise<any> {
        const sanitized = sanitizeUpdateStatusDTO(dto);
        const url = `${end_point}`;
        const updated = await ApiClient.patch(url, { ...sanitized, status });
        return updated;
    },


    async delete(projectStage: Partial<ProjectDoc>): Promise<any> {
        if (!projectStage._id) throw new Error("_id required.");
        const url = `${end_point}/${projectStage._id}`;
        const response = await ApiClient.delete(url);
        return response;
    },
};
