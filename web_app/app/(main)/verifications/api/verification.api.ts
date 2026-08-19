import { ApiClient } from "@/api/ApiClient";
import { EntityApi } from "@/api/EntityApi";
import { Verification } from "../models/verification.model";

const ENDPOINT = "/verifications";

export interface CreateVerificationDTO {
    project: string;
    configuration: string;
    document: File;
    remarks?: string;
}

export const VerificationApi: EntityApi<
    Verification,
    undefined
> & {
    getByConfiguration: (configurationId: string) => Promise<Verification[]>;
} = {
    // ---------------------------
    // Fetch / Query
    // ---------------------------
    async getAll() {
        return ApiClient.get(`${ENDPOINT}`);
    },

    // ---------------------------
    // Get By Id
    // GET /verifications/:id
    // ---------------------------
    async getById(id: string): Promise<Verification> {
        return ApiClient.get(`${ENDPOINT}/${id}`);
    },

    // ---------------------------
    // Get By Configuration ID
    // GET /verifications/configuration/:configurationId
    // ---------------------------
    async getByConfiguration(configurationId: string): Promise<Verification[]> {
        return ApiClient.get(`${ENDPOINT}/configuration/${configurationId}`);
    },

    // ---------------------------
    // Create / Submit Verification (Multipart Form Data)
    // POST /verifications
    // ---------------------------
    async create(dto: CreateVerificationDTO): Promise<Verification> {
        const formData = new FormData();

        // 1. Append the PDF document using 'document' (matches upload.single("document"))
        if (dto.document) {
            formData.append("document", dto.document);
        }

        // 2. Append string / text fields
        formData.append("project", dto.project);
        formData.append("configuration", dto.configuration);

        if (dto.remarks) {
            formData.append("remarks", dto.remarks);
        }

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
        return ApiClient.put(`${ENDPOINT}/${verification._id}`, verification);
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