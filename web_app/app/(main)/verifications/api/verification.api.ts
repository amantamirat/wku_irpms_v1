import { ApiClient } from "@/api/ApiClient";
import { EntityApi } from "@/api/EntityApi";
import { TransitionRequestDto } from "@/types/util";
import { FilterVerification, sanitizeVerification, Verification } from "../models/verification.model";

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
    async create(dto: Verification): Promise<Verification> {
        // Clean and extract all IDs in a single step
        const sanitized = sanitizeVerification(dto);
        const formData = new FormData();

        if (sanitized.document) {
            formData.append("document", sanitized.document);
        }

        // Since sanitizeVerification ran extractId, project & configuration are strings
        if (sanitized.project) {
            formData.append("project", sanitized.project as string);
        }

        if (sanitized.configuration) {
            formData.append("configuration", sanitized.configuration as string);
        }

        /*
        if (sanitized.remarks) {
            formData.append("remarks", sanitized.remarks);
        }
*/
        const created = await ApiClient.post(`${ENDPOINT}`, formData);
        return created as Verification;
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
    async transitionState(id: string, dto: TransitionRequestDto): Promise<any> {
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