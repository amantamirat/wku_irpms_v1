import { ApiClient } from "@/api/ApiClient";
import { EntityApi } from "@/api/EntityApi";
import { TransitionRequestDto } from "@/types/util";
import { Call, GetCallsOptions, sanitizeCall } from "../models/call.model";

const end_point = "/calls";

export const CallApi: EntityApi<Call, GetCallsOptions | undefined> = {
    // ---------------------------
    // Fetch / Query
    // ---------------------------
    async getAll(options) {
        const query = new URLSearchParams();

        if (options) {
            const sanitized = sanitizeCall(options);

            if (options.calendar) {
                query.append("calendar", sanitized.calendar as string);
            }

            if (options.grant) {
                query.append("grant", sanitized.grant as string);
            }

            if (options.status) {
                query.append("status", sanitized.status as string);
            }

            if (options.populate !== undefined) {
                query.append("populate", String(options.populate));
            }
        }

        const qs = query.toString();
        return ApiClient.get(`${end_point}${qs ? `?${qs}` : ""}`);
    },

    // ---------------------------
    // Get By Id
    // ---------------------------
    async getById(id: string): Promise<Call> {
        return ApiClient.get(`${end_point}/${id}`);
    },

    // ---------------------------
    // Create
    // ---------------------------
    async create(call) {
        const sanitized = sanitizeCall(call);
        return ApiClient.post(`${end_point}/`, sanitized);
    },

    // ---------------------------
    // Update
    // ---------------------------
    async update(call) {
        if (!call._id) throw new Error("_id required");
        return ApiClient.put(`${end_point}/${call._id}`, sanitizeCall(call));
    },

    // ---------------------------
    // Transition State (replace updateStatus)
    // ---------------------------
    async transitionState(id: string, dto: TransitionRequestDto): Promise<any> {
        const url = `${end_point}/${id}`;
        return ApiClient.patch(url, dto);
    },

    // ---------------------------
    // Delete
    // ---------------------------
    async delete(call) {
        if (!call._id) throw new Error("_id required");
        return ApiClient.delete(`${end_point}/${call._id}`);
    }
};