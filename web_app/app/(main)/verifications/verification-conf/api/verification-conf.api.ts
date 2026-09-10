import { ApiClient } from "@/api/ApiClient";
import { EntityApi } from "@/api/EntityApi";
import { StateTransition } from "@/api/EntityApi";
import { FilterConfigurationDTO, VerificationConfiguration } from "../models/verification-conf.model";
import { sanitize } from "@/utils/sanitizer";

const end_point = "/verification-configurations";

export const VerificationConfigurationApi: EntityApi<
    VerificationConfiguration,
    FilterConfigurationDTO
> & {
   // transitionState: (id: string, dto: TransitionRequestDto) => Promise<any>;
    getUpcoming: () => Promise<VerificationConfiguration[]>;
} = {
    // ---------------------------
    // Fetch / Query
    // ---------------------------
    async getAll(filter) {
        return await ApiClient.get(end_point, filter);
    },

    async lookup(options) {
        return ApiClient.get(`${end_point}/lookup`, options);
    },

    // ---------------------------
    // Get Upcoming Configurations
    // GET /verification-configurations/upcoming
    // ---------------------------
    async getUpcoming(): Promise<VerificationConfiguration[]> {
        return ApiClient.get(`${end_point}/upcoming`);
    },

    // ---------------------------
    // Get By Id
    // ---------------------------
    async getById(id: string): Promise<VerificationConfiguration> {
        return ApiClient.get(`${end_point}/${id}`);
    },

    // ---------------------------
    // Create
    // ---------------------------
    async create(verificationConfig) {
        const sanitized = sanitize(verificationConfig);
        return ApiClient.post(`${end_point}`, sanitized);
    },

    // ---------------------------
    // Update
    // ---------------------------
    async update(verificationConfig) {
        if (!verificationConfig._id) {
            throw new Error("_id required");
        }
        const sanitized = sanitize(verificationConfig);
        //console.log("client data", JSON.stringify(sanitized));
        return ApiClient.put(`${end_point}/${verificationConfig._id}`, sanitized);
    },

    // ---------------------------
    // Transition State
    // ---------------------------
    async transitionState(id: string, dto: StateTransition): Promise<any> {
        const url = `${end_point}/${id}`;
        return ApiClient.patch(url, dto);
    },

    // ---------------------------
    // Delete
    // ---------------------------
    async delete(verificationConfig) {
        if (!verificationConfig._id) {
            throw new Error("_id required");
        }
        return ApiClient.delete(`${end_point}/${verificationConfig._id}`);
    },
};