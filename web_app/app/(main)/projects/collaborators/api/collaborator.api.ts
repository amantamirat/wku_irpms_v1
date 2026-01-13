import { ApiClient } from "@/api/ApiClient";
import { Collaborator, CollaboratorStatus, GetCollaboratorsOptions, sanitizeCollaborator } from "../models/collaborator.model";
const end_point = '/project/collaborators';



export const CollaboratorApi = {

    async getCollaborators(options: GetCollaboratorsOptions): Promise<Collaborator[]> {
        const query = new URLSearchParams();
        const sanitized = sanitizeCollaborator(options);
        if (sanitized.project) query.append("project", sanitized.project as string);
        if (sanitized.applicant) query.append("applicant", sanitized.applicant as string);
        const data = await ApiClient.get(`${end_point}?${query.toString()}`);
        return data as Collaborator[];
    },

    async createCollaborator(collaborator: Partial<Collaborator>): Promise<Collaborator> {
        const createdData = await ApiClient.post(end_point, sanitizeCollaborator(collaborator));
        return createdData as Collaborator;
    },


    async updateCollaborator(collaborator: Partial<Collaborator>): Promise<Collaborator> {
        if (!collaborator._id) {
            throw new Error("_id required.");
        }
        const query = new URLSearchParams();
        query.append("id", collaborator._id);
        const updatedCollaborator = await ApiClient.put(`${end_point}?${query.toString()}`, sanitizeCollaborator(collaborator));
        return updatedCollaborator as Collaborator;
    },

    async updateStatus(id: string, status: CollaboratorStatus): Promise<any> {
        const query = new URLSearchParams();
        query.append("id", id);
        const url = `${end_point}/${id}`;
        const updated = await ApiClient.patch(url, { status });
        return updated;
    },

    async delete(collaborator: Partial<Collaborator>): Promise<boolean> {
        if (!collaborator._id) {
            throw new Error("_id required.");
        }
        const url = `${end_point}/${collaborator._id}`;
        const response = await ApiClient.delete(url);
        return response;
    },
};
