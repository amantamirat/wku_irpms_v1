import { EntityApi } from "@/api/EntityApi";
import { ApiClient } from "@/api/ApiClient";
import { FilterPhaseOptions, Phase } from "../models/phase.model";
import { StateTransition } from "@/api/EntityApi";
import { sanitize } from "@/utils/utils";

const end_point = "/project/phases";

export const PhaseApi: EntityApi<Phase, FilterPhaseOptions | undefined> = {

    async getAll(options?: FilterPhaseOptions): Promise<Phase[]> {
        const data = await ApiClient.get(end_point, options);
        return data as Phase[];
    },

    async lookup(options) {
        return ApiClient.get(`${end_point}/lookup`, options);
    },

    async getById(id: string): Promise<Phase> {
        const url = `${end_point}/${id}`;
        const data = await ApiClient.get(url);
        return data as Phase;
    },

    async create(phase: Partial<Phase>): Promise<Phase> {
        const sanitized = sanitize(phase);
        const createdData = await ApiClient.post(end_point, sanitized);
        return createdData as Phase;
    },

    async update(phase: Partial<Phase>): Promise<Phase> {
        if (!phase._id) throw new Error("_id required");

        const sanitized = sanitize(phase);
        // Matches the pattern: PUT /project/phases/:id
        const url = `${end_point}/${phase._id}`;

        const updatedPhase = await ApiClient.put(url, sanitized);
        return updatedPhase as Phase;
    },

    async delete(phase: Partial<Phase>): Promise<boolean> {
        if (!phase._id) throw new Error("_id required");

        const url = `${end_point}/${phase._id}`;
        return await ApiClient.delete(url);
    },

    async transitionState(id: string, dto: StateTransition): Promise<Phase> {
        // Matches the pattern: PATCH /project/phases/:id
        const url = `${end_point}/${id}`;
        const updated = await ApiClient.patch(url, dto);
        return updated as Phase;
    }
};