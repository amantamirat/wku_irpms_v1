import { ApiClient } from "@/api/ApiClient";
import { Constraint } from "../models/constraint.model";
import { Grant } from "../../models/grant.model";


const end_point = '/constraints';

function sanitizeConstraint(constraint: Partial<Constraint>): Partial<Constraint> {
    return {
        ...constraint,
        grant:
            typeof constraint.grant === 'object' && constraint.grant !== null
                ? (constraint.grant as Grant)._id
                : constraint.grant
    };
}

export interface GetConstraintsOptions {
    grant?: string;
}

export const ConstraintApi = {

    async createConstraint(constraint: Partial<Constraint>): Promise<Constraint> {
        const sanitized = sanitizeConstraint(constraint);
        const createdData = await ApiClient.post(end_point, sanitized);
        return createdData as Constraint;
    },

    async getConstraints(options: GetConstraintsOptions): Promise<Constraint[]> {
        const query = new URLSearchParams();
        if (options.grant) query.append("grant", options.grant);
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
