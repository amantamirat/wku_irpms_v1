import { EntityApi } from "@/api/EntityApi";
import { ApiClient } from "@/api/ApiClient";
import { 
    Collaborator, 
    CollaboratorStatus, 
    GetCollaboratorsOptions, 
    sanitizeCollaborator 
} from "../models/collaborator.model";
import { TransitionRequestDto } from "@/types/util";

const end_point = '/project/collaborators';

export const CollaboratorApi: EntityApi<Collaborator, GetCollaboratorsOptions | undefined> = {

    async getAll(options?: GetCollaboratorsOptions): Promise<Collaborator[]> {
        const query = new URLSearchParams();

        if (options) {
            const sanitized = sanitizeCollaborator(options);
            if (sanitized.project) query.append("project", sanitized.project as string);
            if (sanitized.applicant) query.append("applicant", sanitized.applicant as string);
            if (sanitized.status) query.append("status", sanitized.status);
        }

        const url = query.toString() 
            ? `${end_point}?${query.toString()}` 
            : end_point;

        const data = await ApiClient.get(url);
        return data as Collaborator[];
    },

    async getById(id: string): Promise<Collaborator> {
        const url = `${end_point}/${id}`;
        const data = await ApiClient.get(url);
        return data as Collaborator;
    },

    async create(collaborator: Partial<Collaborator>): Promise<Collaborator> {
        const sanitized = sanitizeCollaborator(collaborator);
        const createdData = await ApiClient.post(end_point, sanitized);
        return createdData as Collaborator;
    },

    async update(collaborator: Partial<Collaborator>): Promise<Collaborator> {
        if (!collaborator._id) throw new Error("_id required");
        const sanitized = sanitizeCollaborator(collaborator);
        
        // Using URL parameter pattern: PUT /project/collaborators/:id
        const url = `${end_point}/${collaborator._id}`;
        const updated = await ApiClient.put(url, sanitized);
        return updated as Collaborator;
    },

    async delete(collaborator: Partial<Collaborator>): Promise<boolean> {
        if (!collaborator._id) throw new Error("_id required");
        const url = `${end_point}/${collaborator._id}`;
        return await ApiClient.delete(url);
    },

    async transitionState(id: string, dto: TransitionRequestDto): Promise<Collaborator> {
        // Matches the pattern: PATCH /project/collaborators/:id
        const url = `${end_point}/${id}`;
        const updated = await ApiClient.patch(url, dto);
        return updated as Collaborator;
    }
};