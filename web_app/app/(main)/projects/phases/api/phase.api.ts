import { EntityApi } from "@/api/EntityApi";
import { ApiClient } from "@/api/ApiClient";
import { GetPhaseOptions, Phase, sanitizePhase } from "../models/phase.model";
import { TransitionRequestDto } from "@/types/util";

const end_point = "/project/phases";

export const PhaseApi: EntityApi<Phase, GetPhaseOptions | undefined> = {

    async getAll(options?: GetPhaseOptions): Promise<Phase[]> {
        const query = new URLSearchParams();

        if (options) {
            const sanitized = sanitizePhase(options);
            if (sanitized.project) {
                query.append("project", sanitized.project as string);
            }
            // Add populate option if your GetPhaseOptions supports it
            if ((options as any).populate !== undefined) {
                query.append("populate", String((options as any).populate));
            }
        }

        const url = query.toString()
            ? `${end_point}?${query.toString()}`
            : end_point;

        const data = await ApiClient.get(url);
        return data as Phase[];
    },

    async getById(id: string): Promise<Phase> {
        const url = `${end_point}/${id}`;
        const data = await ApiClient.get(url);
        return data as Phase;
    },

    async create(phase: Partial<Phase>): Promise<Phase> {
        const sanitized = sanitizePhase(phase);
        const createdData = await ApiClient.post(end_point, sanitized);
        return createdData as Phase;
    },

    async update(phase: Partial<Phase>): Promise<Phase> {
        if (!phase._id) throw new Error("_id required");
        
        const sanitized = sanitizePhase(phase);
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

    async transitionState(id: string, dto: TransitionRequestDto): Promise<Phase> {
        // Matches the pattern: PATCH /project/phases/:id
        const url = `${end_point}/${id}`;
        const updated = await ApiClient.patch(url, dto);
        return updated as Phase;
    }
};