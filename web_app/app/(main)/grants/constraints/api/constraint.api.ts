import { ApiClient } from "@/api/ApiClient";
import { Constraint, GetConstraintsOptions, sanitizeConstraint } from "../models/constraint.model";

const end_point = '/grants/constraints';

export const ConstraintApi = {

    async create(constraint: Partial<Constraint>): Promise<Constraint> {
        const sanitized = sanitizeConstraint(constraint);
        const createdData = await ApiClient.post(end_point, sanitized);
        return createdData as Constraint;
    },

    async getAll(options: GetConstraintsOptions): Promise<Constraint[]> {
        const query = new URLSearchParams();
        const sanitized = sanitizeConstraint(options);
        if (options.grant) query.append("grant", sanitized.grant as string);
        const data = await ApiClient.get(`${end_point}?${query.toString()}`);
        return data as Constraint[];
    },


    async update(constraint: Partial<Constraint>): Promise<Constraint> {
        if (!constraint._id) {
            throw new Error("_id required.");
        }
        const url = `${end_point}/${constraint._id}`;
        const sanitized = sanitizeConstraint(constraint);
        const updatedConstraint = await ApiClient.put(url, sanitized);
        return updatedConstraint as Constraint;
    },

    async delete(constraint: Partial<Constraint>): Promise<boolean> {
        if (!constraint._id) {
            throw new Error("_id required.");
        }
        const url = `${end_point}/${constraint._id}`;
        const response = await ApiClient.delete(url);
        return response;
    },
};
