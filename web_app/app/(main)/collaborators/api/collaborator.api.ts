import { ApiClient } from "@/api/ApiClient";
import { EntityApi } from "@/api/EntityApi";
import { StateTransition } from "@/api/EntityApi";
import {
    Collaborator,
    FilterCollaboratorsOptions
} from "../models/collaborator.model";
import { sanitize } from "@/utils/utils";

const end_point = '/project/collaborators';

export const CollaboratorApi: EntityApi<Collaborator, FilterCollaboratorsOptions | undefined>
    & {
        me: (options?: FilterCollaboratorsOptions) => Promise<Collaborator[]>;

    } = {

    async getAll(filter?: FilterCollaboratorsOptions, populate?: boolean): Promise<Collaborator[]> {

        const data = await ApiClient.get(end_point, filter);
        return data as Collaborator[];
    },

    async lookup(filter) {
        return ApiClient.get(`${end_point}/lookup`, filter);
    },

    async me(
        filter?: Omit<FilterCollaboratorsOptions, "member">
    ): Promise<Collaborator[]> {
        const data = await ApiClient.get(`${end_point}/me`, filter);
        return data as Collaborator[];
    },

    async getById(id: string): Promise<Collaborator> {
        const url = `${end_point}/${id}`;
        const data = await ApiClient.get(url);
        return data as Collaborator;
    },

    async create(collaborator: Partial<Collaborator>): Promise<Collaborator> {
        const sanitized = sanitize(collaborator);
        const createdData = await ApiClient.post(end_point, sanitized);
        return createdData as Collaborator;
    },

    async update(collaborator: Partial<Collaborator>): Promise<Collaborator> {
        if (!collaborator._id) throw new Error("_id required");
        const sanitized = sanitize(collaborator);
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

    async transitionState(id: string, dto: StateTransition): Promise<Collaborator> {
        // Matches the pattern: PATCH /project/collaborators/:id
        const url = `${end_point}/${id}`;
        const updated = await ApiClient.patch(url, dto);
        return updated as Collaborator;
    }
};