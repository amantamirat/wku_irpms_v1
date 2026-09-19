import { ApiClient } from "@/api/ApiClient";
import { EntityApi } from "@/api/EntityApi";
import { Constraint } from "../models/constraint.model";
import { sanitize } from "@/utils/utils";

const end_point = "/constraints";

export const ConstraintApi: EntityApi<Constraint> = {

    // ---------------------------
    // Fetch
    // ---------------------------
    async getAll() {
        return ApiClient.get(end_point);
    },

    async lookup(filter) {
        return ApiClient.get(`${end_point}/lookup`, filter);
    },

    // ---------------------------
    // Get By Id
    // ---------------------------
    async getById(id: string): Promise<Constraint> {
        return ApiClient.get(`${end_point}/${id}`);
    },

    // ---------------------------
    // Create
    // ---------------------------
    async create(constraint) {
        return ApiClient.post(
            end_point,
            sanitize(constraint)
        );
    },

    // ---------------------------
    // Update
    // ---------------------------
    async update(constraint) {
        if (!constraint._id) {
            throw new Error("_id required");
        }

        return ApiClient.put(
            `${end_point}/${constraint._id}`,
            sanitize(constraint)
        );
    },

    // ---------------------------
    // Delete
    // ---------------------------
    async delete(constraint) {
        if (!constraint._id) {
            throw new Error("_id required");
        }

        return ApiClient.delete(
            `${end_point}/${constraint._id}`
        );
    }
};
