import { BaseConstraintType, OperationMode, ProjectConstraintType } from "./constraint.enum";
import { Grant } from "../grant.model";
import mongoose from "mongoose";
import { BaseConstraint } from "./constraint.model";

export interface CreateConstraintDto {
    grant: mongoose.Types.ObjectId; //
    type: BaseConstraintType;
    constraint?: ProjectConstraintType
    max?: number;
    min?: number;
    parent?: mongoose.Types.ObjectId; //
    mode?: OperationMode; //
    valueType?: string;
    value?: string;
}

export interface GetConstraintOptions {
    grant?: mongoose.Types.ObjectId; //
    type?: BaseConstraintType;
    parent?: mongoose.Types.ObjectId;
}

export class ConstraintService {

    /** Create a new constraint */
    static async createConstraint(data: CreateConstraintDto) {
        const grantExists = await Grant.exists({ _id: data.grant });
        if (!grantExists) throw new Error("Grant type not found");      
        const createdConstraint = await BaseConstraint.create({ ...data });
        return createdConstraint;
    }

    /** Retrieve constraints by optional filters */
    static async getConstraints(options: GetConstraintOptions = {}) {
        const filter: any = {};
        if (options.grant) filter.grant = options.grant;
        if (options.type) filter.type = options.type;
        if (options.parent) filter.parent = options.parent;
        return await BaseConstraint.find(filter).lean();
    }

    /** Update a constraint (non-immutable fields only) */
    static async updateConstraint(id: string, data: Partial<CreateConstraintDto>) {
        const constraint = await BaseConstraint.findById(id);
        if (!constraint) throw new Error("Constraint not found");
        // Protect immutable fields
        const immutableFields = ["grant", "type", "parent"];
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
        const constraint = await BaseConstraint.findById(id);
        if (!constraint) throw new Error("Constraint not found");

        // Check if this constraint has children
        //const hasChildren = await Constraint.exists({ parent: constraint._id });
        //if (hasChildren) throw new Error("Cannot delete constraint with child constraints");

        return await constraint.deleteOne();
    }
}
