import { ApiClient } from "@/api/ApiClient";
import { EntityApi } from "@/api/EntityApi";
import { TransitionRequestDto } from "@/types/util";
import { VerificationConfiguration, sanitizeVerificationConfiguration } from "../models/verification-conf.model";

const ENDPOINT = "/verification-configurations";

export const VerificationConfigurationApi: EntityApi<
    VerificationConfiguration,
    undefined
> & {
    transitionState: (id: string, dto: TransitionRequestDto) => Promise<any>;
    getUpcoming: () => Promise<VerificationConfiguration[]>;
} = {
    // ---------------------------
    // Fetch / Query
    // ---------------------------
    async getAll() {
        const query = new URLSearchParams();
        const qs = query.toString();
        return ApiClient.get(`${ENDPOINT}${qs ? `?${qs}` : ""}`);
    },

    // ---------------------------
    // Get Upcoming Configurations
    // GET /verification-configurations/upcoming
    // ---------------------------
    async getUpcoming(): Promise<VerificationConfiguration[]> {
        return ApiClient.get(`${ENDPOINT}/upcoming`);
    },

    // ---------------------------
    // Get By Id
    // ---------------------------
    async getById(id: string): Promise<VerificationConfiguration> {
        return ApiClient.get(`${ENDPOINT}/${id}`);
    },

    // ---------------------------
    // Create
    // ---------------------------
    async create(verificationConfig) {
        const sanitized = sanitizeVerificationConfiguration(verificationConfig);
        return ApiClient.post(`${ENDPOINT}`, sanitized);
    },

    // ---------------------------
    // Update
    // ---------------------------
    async update(verificationConfig) {
        if (!verificationConfig._id) {
            throw new Error("_id required");
        }
        const sanitized = sanitizeVerificationConfiguration(verificationConfig);
        return ApiClient.put(`${ENDPOINT}/${verificationConfig._id}`, sanitized);
    },

    // ---------------------------
    // Transition State
    // ---------------------------
    async transitionState(id: string, dto: TransitionRequestDto): Promise<any> {
        const url = `${ENDPOINT}/${id}`;
        return ApiClient.patch(url, dto);
    },

    // ---------------------------
    // Delete
    // ---------------------------
    async delete(verificationConfig) {
        if (!verificationConfig._id) {
            throw new Error("_id required");
        }
        return ApiClient.delete(`${ENDPOINT}/${verificationConfig._id}`);
    },
};