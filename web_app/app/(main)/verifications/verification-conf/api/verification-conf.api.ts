import { ApiClient } from "@/api/ApiClient";
import { EntityApi } from "@/api/EntityApi";
import { TransitionRequestDto } from "@/types/util";
import { FilterConfigurationDTO, VerificationConfiguration } from "../models/verification-conf.model";
import { sanitize } from "@/utils/sanitizer";

const ENDPOINT = "/verification-configurations";

export const VerificationConfigurationApi: EntityApi<
    VerificationConfiguration,
    FilterConfigurationDTO
> & {
    transitionState: (id: string, dto: TransitionRequestDto) => Promise<any>;
    getUpcoming: () => Promise<VerificationConfiguration[]>;
} = {
    // ---------------------------
    // Fetch / Query
    // ---------------------------
    async getAll(filter) {
        return await ApiClient.get(ENDPOINT, filter);
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
        const sanitized = sanitize(verificationConfig);
        return ApiClient.post(`${ENDPOINT}`, sanitized);
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