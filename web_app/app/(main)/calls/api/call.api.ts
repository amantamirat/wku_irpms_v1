import { ApiClient } from "@/api/ApiClient";
import { EntityApi } from "@/api/EntityApi";
import { StateTransition } from "@/api/EntityApi";
import { Call, FilterCallsOptions } from "../models/call.model";
import { sanitize } from "@/utils/utils";

const end_point = "/calls";

export const CallApi: EntityApi<Call, FilterCallsOptions | undefined>
    = {
    // ---------------------------
    // Fetch / Query
    // ---------------------------
    async getAll(filter: FilterCallsOptions) {
        return ApiClient.get(end_point, filter);
    },

    async lookup(filter) {
        return ApiClient.get(`${end_point}/lookup`, filter);
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
        const sanitized = sanitize(call);
        return ApiClient.post(`${end_point}`, sanitized);
    },

    // ---------------------------
    // Update
    // ---------------------------
    async update(call) {
        if (!call._id) throw new Error("_id required");
        // We pass the ID and the sanitized body separately 
        // to match common REST patterns
        return ApiClient.put(`${end_point}/${call._id}`, sanitize(call));
    },

    // ---------------------------
    // Transition State
    // ---------------------------
    async transitionState(id: string, dto: StateTransition): Promise<any> {
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