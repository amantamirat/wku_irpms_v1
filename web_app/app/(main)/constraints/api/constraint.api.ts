import { EntityApi } from "@/api/EntityApi";
import { ApiClient } from "@/api/ApiClient";
import { Constraint } from "../models/constraint.model";


export const ConstraintApi: EntityApi<Constraint> = {

    async getAll() {
        return ApiClient.get('/constraints/');
    },

    async getById(id: string): Promise<Constraint> {
        return ApiClient.get(`/constraints/${id}`);
    },

    async create(constraint) {
        return ApiClient.post(
            '/constraints/',
            constraint
        );
    },


    async update(constraint) {
        if (!constraint._id) {
            throw new Error("_id required");
        }

        return ApiClient.put(
            `/constraints/${constraint._id}`,
            constraint
        );
    },


    async delete(constraint) {
        if (!constraint._id) {
            throw new Error("_id required");
        }

        return ApiClient.delete(
            `/constraints/${constraint._id}`
        );
    }
};