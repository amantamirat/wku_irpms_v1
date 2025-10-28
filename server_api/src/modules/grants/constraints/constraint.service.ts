import mongoose from "mongoose";
import { Grant } from "../grant.model";
import { ApplicantConstraintType, ConstraintType, OperationMode, ProjectConstraintType } from "./constraint.enum";
import { Constraint } from "./constraint.model";


export interface CreateConstraintDto {
    type: ConstraintType;
    grant: mongoose.Types.ObjectId;
    constraint: ProjectConstraintType | ApplicantConstraintType;
    min?: number;
    max?: number;
    mode?: OperationMode;
}


export interface GetConstraintOptions {
    grant?: mongoose.Types.ObjectId;
    type?: ConstraintType;
}

export class ConstraintService {

    static async validateConstraint(data: Partial<CreateConstraintDto>) {
        if (data.type === ConstraintType.APPLICANT) {
            if (!data.mode) {
                throw new Error("Operation mode must be specified for applicant constraints.");
            }
        }        
    }

    static async createConstraint(data: CreateConstraintDto) {
        const grant = await Grant.findById(data.grant).lean();
        if (!grant) throw new Error("Grant type not found");
        await this.validateConstraint(data);        
        const createdConstraint = await Constraint.create({ ...data });
        return createdConstraint;
    }

    static async getConstraints(options: GetConstraintOptions = {}) {
        const filter: any = {};
        if (options.grant) filter.grant = options.grant;
        if (options.type) filter.type = options.type;
        return await Constraint.find(filter).lean();
    }

    static async updateConstraint(id: string, data: Partial<CreateConstraintDto>) {
        const constraint = await Constraint.findById(id);
        if (!constraint) throw new Error("Constraint not found");
        Object.assign(constraint, data);
        return await constraint.save();
    }

    /** Delete a constraint safely (ensure no child constraints exist) */
    static async deleteConstraint(id: string) {
        const constraint = await Constraint.findById(id);
        if (!constraint) throw new Error("Constraint not found");
        return await constraint.deleteOne();
    }
}
