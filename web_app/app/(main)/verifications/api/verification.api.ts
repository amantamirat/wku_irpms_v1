import { ApiClient } from "@/api/ApiClient";
import { EntityApi } from "@/api/EntityApi";
import { StateTransition } from "@/api/EntityApi";
import { FilterVerification, sanitizeVerification, Verification } from "../models/verification.model";
import { sanitize } from "@/utils/utils";

const ENDPOINT = "/verifications";

export const VerificationApi: EntityApi<
    Verification,
    FilterVerification
> & {
    //getByConfiguration: (configurationId: string) => Promise<Verification[]>;
    //getByProject: (projectId: string) => Promise<Verification[]>;
} = {
    // ---------------------------
    // Fetch / Query
    // ---------------------------
    async getAll(filter?: FilterVerification) {
        return ApiClient.get(ENDPOINT, filter);
    },

    // ---------------------------
    // Get By Id
    // GET /verifications/:id
    // ---------------------------
    async getById(id: string): Promise<Verification> {
        return ApiClient.get(`${ENDPOINT}/${id}`);
    },

    /*
    // ---------------------------
    // Get By Configuration ID
    // GET /verifications/configuration/:configurationId
    // ---------------------------

    async getByConfiguration(configurationId: string): Promise<Verification[]> {
        return ApiClient.get(`${ENDPOINT}/configuration/${configurationId}`);
    },

    // ---------------------------
    // Get By Project ID
    // GET /verifications/project/:projectId
    // ---------------------------
    async getByProject(projectId: string): Promise<Verification[]> {
        return ApiClient.get(`${ENDPOINT}/project/${projectId}`);
    },
*/
    // ---------------------------
    // Create / Submit Verification (Multipart Form Data)
    // POST /verifications
    // ---------------------------
    async create(verification: Partial<Verification>): Promise<Verification> {
        const formData = new FormData();

        // 1. Separate the file if it exists
        if (verification.file) {
            formData.append("file", verification.file);
        }

        // 2. Remove the file before sanitizing metadata
        const { file, ...verificationWithoutFile } = verification;
        const sanitized = sanitize(verificationWithoutFile);

        // 3. Append the verification metadata as a JSON string
        formData.append("verification", JSON.stringify(sanitized));

        return ApiClient.post(`${ENDPOINT}`, formData);
    },

    // ---------------------------
    // Update
    // ---------------------------
    async update(verification: Verification) {
        if (!verification._id) {
            throw new Error("_id required");
        }
        return ApiClient.put(`${ENDPOINT}/${verification._id}`, sanitizeVerification(verification));
    },

    // ---------------------------
    // Transition State
    // ---------------------------
    async transitionState(id: string, dto: StateTransition): Promise<any> {
        const url = `${ENDPOINT}/${id}/transition`;
        return ApiClient.patch(url, dto);
    },

    // ---------------------------
    // Delete
    // ---------------------------
    async delete(verification: Verification) {
        if (!verification._id) {
            throw new Error("_id required");
        }
        return ApiClient.delete(`${ENDPOINT}/${verification._id}`);
    },
};