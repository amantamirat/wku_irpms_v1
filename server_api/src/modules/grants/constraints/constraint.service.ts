import { Constraint } from "./constraint.model";
import { ConstraintType } from "./constraint.enum";
import { Grant } from "../grant.model";

export interface CreateConstraintDto {
    grant: string; // ObjectId as string
    type: ConstraintType;
    parent?: string; // ObjectId as string
    mode_filter?: string; // "OBEY" | "DENY" | "FILTER" | etc.
    value?: string;
    max?: number;
    min?: number;
}

export interface GetConstraintOptions {
    grantType?: string;
    type?: ConstraintType;
    parent?: string | null;
}

export class ConstraintService {

    /** Create a new constraint */
    static async createConstraint(data: CreateConstraintDto) {
        // Validate grantType exists
        const grantTypeExists = await Grant.exists({ _id: data.grant });
        if (!grantTypeExists) throw new Error("Grant type not found");

        // If parent exists, ensure it's valid
        if (data.parent) {
            const parentConstraint = await Constraint.findById(data.parent);
            if (!parentConstraint) throw new Error("Parent constraint not found");
        }

        const createdConstraint = await Constraint.create({ ...data });
        return createdConstraint;
    }

    /** Retrieve constraints by optional filters */
    static async getConstraints(options: GetConstraintOptions = {}) {
        const filter: any = {};
        if (options.grantType) filter.grantType = options.grantType;
        if (options.type) filter.type = options.type;
        if (options.parent !== undefined) filter.parent = options.parent;
        return await Constraint.find(filter).lean();
    }

    /** Update a constraint (non-immutable fields only) */
    static async updateConstraint(id: string, data: Partial<CreateConstraintDto>) {
        const constraint = await Constraint.findById(id);
        if (!constraint) throw new Error("Constraint not found");

        // Protect immutable fields
        const immutableFields = ["grantType", "type", "parent"];
        for (const field of immutableFields) {
            if (data[field as keyof CreateConstraintDto]) {
                throw new Error(`Field ${field} is immutable and cannot be updated`);
            }
        }

        Object.assign(constraint, data);
        return await constraint.save();
    }

    /** Delete a constraint safely (ensure no child constraints exist) */
    static async deleteConstraint(id: string) {
        const constraint = await Constraint.findById(id);
        if (!constraint) throw new Error("Constraint not found");

        // Check if this constraint has children
        const hasChildren = await Constraint.exists({ parent: constraint._id });
        if (hasChildren) throw new Error("Cannot delete constraint with child constraints");

        return await constraint.deleteOne();
    }
}
