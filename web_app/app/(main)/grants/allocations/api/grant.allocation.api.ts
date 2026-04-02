import { EntityApi } from "@/api/EntityApi";
import { ApiClient } from "@/api/ApiClient";
import { GrantAllocation, GetGrantAllocationsDTO, sanitizeGrantAllocation } from "../models/grant.allocation.model";
import { TransitionRequestDto } from "@/types/util";

const end_point = "/grants/allocations";

export const GrantAllocationApi: EntityApi<GrantAllocation, GetGrantAllocationsDTO> = {

    async getAll(options?: GetGrantAllocationsDTO) {
        const query = new URLSearchParams();

        if (options) {
            const sanitized: Partial<GrantAllocation> = sanitizeGrantAllocation(options as any);
            if (options.grant) query.append("grant", sanitized.grant as string);
            if (options.calendar) query.append("calendar", sanitized.calendar as string);
            if (options.status) query.append("status", options.status as string);
            if (options.populate !== undefined) {
                query.append("populate", String(options.populate));
            }
        }

        const url = query.toString() ? `${end_point}?${query.toString()}` : end_point;
        return ApiClient.get(url);
    },

    async create(allocation: GrantAllocation) {
        const sanitized = sanitizeGrantAllocation(allocation);
        return ApiClient.post(end_point, sanitized);
    },

    async update(allocation: GrantAllocation) {
        if (!allocation._id) throw new Error("_id required");
        const sanitized = sanitizeGrantAllocation(allocation);
        return ApiClient.put(`${end_point}/${allocation._id}`, sanitized);
    },

    async transitionState(id: string, dto: TransitionRequestDto): Promise<any> {
        const url = `${end_point}/${id}`;
        return ApiClient.patch(url, dto);
    },

    async delete(allocation: GrantAllocation) {
        if (!allocation._id) throw new Error("_id required");
        return ApiClient.delete(`${end_point}/${allocation._id}`);
    },

};