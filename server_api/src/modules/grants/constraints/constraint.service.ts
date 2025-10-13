import mongoose from "mongoose";
import { Grant } from "../grant.model";
import { Composition } from "./compositions/composition.model";
import { ApplicantConstraintType, BaseConstraintType, isListConstraint, isRangeConstraint, OperationMode, ProjectConstraintType } from "./constraint.enum";
import { ApplicantConstraint, BaseConstraint } from "./constraint.model";


export interface CreateConstraintDto {
    type: BaseConstraintType;
    grant: mongoose.Types.ObjectId;
    constraint: ProjectConstraintType | ApplicantConstraintType;
    min?: number;
    max?: number;
    mode?: OperationMode;
}



export interface GetConstraintOptions {
    grant?: mongoose.Types.ObjectId;
    type?: BaseConstraintType;
}

export class ConstraintService {

    static async validateConstraint(data: Partial<CreateConstraintDto>) {
        if (data.type === BaseConstraintType.APPLICANT) {
            if (!data.mode) {
                throw new Error("Operation mode must be specified for applicant constraints.");
            }
        }        
    }

    static async createConstraint(data: CreateConstraintDto) {
        const grant = await Grant.findById(data.grant).lean();
        if (!grant) throw new Error("Grant type not found");
        await this.validateConstraint(data);        
        const createdConstraint = await BaseConstraint.create({ ...data });
        return createdConstraint;
    }

    static async getConstraints(options: GetConstraintOptions = {}) {
        const filter: any = {};
        if (options.grant) filter.grant = options.grant;
        if (options.type) filter.type = options.type;
        return await BaseConstraint.find(filter).lean();
    }


    static async updateConstraint(id: string, data: Partial<CreateConstraintDto>) {
        const constraint = await BaseConstraint.findById(id);
        if (!constraint) throw new Error("Constraint not found");
        Object.assign(constraint, data);
        return await constraint.save();
    }

    /** Delete a constraint safely (ensure no child constraints exist) */
    static async deleteConstraint(id: string) {
        const constraint = await BaseConstraint.findById(id);
        if (!constraint) throw new Error("Constraint not found");
        return await constraint.deleteOne();
    }
}
