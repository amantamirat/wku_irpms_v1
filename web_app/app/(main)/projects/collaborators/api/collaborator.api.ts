import { ApiClient } from "@/api/ApiClient";
import { Collaborator } from "../models/collaborator.model";
const end_point = '/collaborators/';

export interface GetCollaboratorsOptions {
    project?: string;
}

export const CollaboratorApi = {

    async getCollaborators(options: GetCollaboratorsOptions): Promise<Collaborator[]> {
        const query = new URLSearchParams();
        if (options.project) query.append("project", options.project);
        const data = await ApiClient.get(`${end_point}?${query.toString()}`);
        return data as Collaborator[];
    },

    async createCollaborator(collaborator: Partial<Collaborator>): Promise<Collaborator> {
        const createdData = await ApiClient.post(end_point, collaborator);
        return createdData as Collaborator;
    },

    async updateCollaborator(collaborator: Partial<Collaborator>): Promise<Collaborator> {
        if (!collaborator._id) {
            throw new Error("_id required.");
        }
        const url = `${end_point}${collaborator._id}`;
        const updatedCollaborator = await ApiClient.put(url, collaborator);
        return updatedCollaborator as Collaborator;
    },

    async deleteCollaborator(collaborator: Partial<Collaborator>): Promise<boolean> {
        if (!collaborator._id) {
            throw new Error("_id required.");
        }
        const url = `${end_point}${collaborator._id}`;
        const response = await ApiClient.delete(url);
        return response;
    },
};
