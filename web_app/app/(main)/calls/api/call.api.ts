import { ApiClient } from "@/api/ApiClient";
import { EntityApi } from "@/api/EntityApi";
import { TransitionRequestDto } from "@/types/util";
import { Call, GetCallsOptions, sanitizeCall } from "../models/call.model";

const end_point = "/calls";

export const CallApi: EntityApi<Call, GetCallsOptions | undefined> = {
    // ---------------------------
    // Fetch / Query
    // ---------------------------
    async getAll(options: GetCallsOptions) {
        const query = new URLSearchParams();

        if (options) {
            const sanitized = sanitizeCall(options);

            // Dynamically append all present keys
            Object.entries(sanitized).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    query.append(key, String(value));
                }
            });
        }

        const qs = query.toString();
        const url = `${end_point}${qs ? `?${qs}` : ""}`;

        return ApiClient.get(url);
    },

    // ---------------------------
    // Get By Id
    // ---------------------------
    async getById(id: string, populate?: boolean): Promise<Call> {
        const query = populate !== undefined ? `?populate=${populate}` : '';
        return ApiClient.get(`${end_point}/${id}${query}`);
    },

    // ---------------------------
    // Create
    // ---------------------------
    async create(call) {
        const sanitized = sanitizeCall(call);
        return ApiClient.post(`${end_point}`, sanitized);
    },

    // ---------------------------
    // Update
    // ---------------------------
    async update(call) {
        if (!call._id) throw new Error("_id required");
        // We pass the ID and the sanitized body separately 
        // to match common REST patterns
        return ApiClient.put(`${end_point}/${call._id}`, sanitizeCall(call));
    },

    // ---------------------------
    // Transition State
    // ---------------------------
    async transitionState(id: string, dto: TransitionRequestDto): Promise<any> {
        const url = `${end_point}/${id}/transition`; // Often better to have a specific sub-route for transitions
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