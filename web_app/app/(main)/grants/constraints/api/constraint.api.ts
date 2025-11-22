import { ApiClient } from "@/api/ApiClient";
import { Constraint, GetConstraintsOptions, sanitizeConstraint } from "../models/constraint.model";


const end_point = '/grants/constraints';



export const ConstraintApi = {

    async createConstraint(constraint: Partial<Constraint>): Promise<Constraint> {
        const sanitized = sanitizeConstraint(constraint);
        const createdData = await ApiClient.post(end_point, sanitized);
        return createdData as Constraint;
    },

    async getConstraints(options: GetConstraintsOptions): Promise<Constraint[]> {
        const query = new URLSearchParams();
        const sanitized = sanitizeConstraint(options);
        if (options.grant) query.append("grant", sanitized.grant as string);
        if (options.type) query.append("type", options.type);
        const data = await ApiClient.get(`${end_point}?${query.toString()}`);
        return data as Constraint[];
    },


    async updateConstraint(constraint: Partial<Constraint>): Promise<Constraint> {
        if (!constraint._id) {
            throw new Error("_id required.");
        }
        const url = `${end_point}/${constraint._id}`;
        const sanitized = sanitizeConstraint(constraint);
        const updatedConstraint = await ApiClient.put(url, sanitized);
        return updatedConstraint as Constraint;
    },

    async deleteConstraint(constraint: Partial<Constraint>): Promise<boolean> {
        if (!constraint._id) {
            throw new Error("_id required.");
        }
        const url = `${end_point}/${constraint._id}`;
        const response = await ApiClient.delete(url);
        return response;
    },
};
