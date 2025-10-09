import mongoose from "mongoose";
import { Grant } from "../grant.model";
import { Composition } from "./composition.model";
import { ApplicantConstraintType, BaseConstraintType, isListConstraint, isRangeConstraint, OperationMode, ProjectConstraintType } from "./constraint.enum";
import { ApplicantConstraint, BaseConstraint } from "./constraint.model";


export interface CreateProjectConstraintDto {
    type: BaseConstraintType.PROJECT;
    grant: mongoose.Types.ObjectId;
    constraint: ProjectConstraintType;
    min: number;
    max: number;
}

export interface CreateConstraintDto {
    type: BaseConstraintType | "Composition";
    grant: mongoose.Types.ObjectId;
    constraint: ProjectConstraintType | ApplicantConstraintType;
    min?: number;
    max?: number;
    mode?: OperationMode;
    parent?: mongoose.Types.ObjectId;
    value?: number;
    item?: string;
}

export interface GetConstraintOptions {
    grant?: mongoose.Types.ObjectId;
    type?: BaseConstraintType;
    parent?: mongoose.Types.ObjectId;
}

export class ConstraintService {

    static async validateConstraint(data: Partial<CreateConstraintDto>) {
        if (data.type === BaseConstraintType.APPLICANT) {
            if (!data.mode) {
                throw new Error("Operation mode must be specified for applicant constraints.");
            }
        }
        if (data.type === "Composition") {
            const parentConstraint = await ApplicantConstraint.findById(data.parent);
            if (!parentConstraint) {
                throw new Error("Parent applicant constraint not found for composition constraint.");
            }
            const mode = parentConstraint.mode;
            if (mode === OperationMode.RATIO) {
                if ((!data.value && data.value !== 0) || data.value < 0 || data.value > 1) {
                    throw new Error("Value must be a ratio (between 0 and 1) for ratio-based composition constraints.");
                }
            }
            else if (mode === OperationMode.COUNT) {
                if ((!data.value && data.value !== 0)) {
                    throw new Error("Value must be specified for count-based composition constraints.");
                }
            }
            const applicantType = parentConstraint.constraint;
            if (isRangeConstraint(applicantType as ApplicantConstraintType)) {
                if ((!data.max || !data.min)) {
                    throw new Error(`Range must be specified for ${applicantType} constraint.`);
                }
            }
            else if (isListConstraint(applicantType as ApplicantConstraintType)) {
                if (!data.item) {
                    throw new Error(`Item must be specified for ${applicantType} constraint.`);
                }
            }
        }
    }

    static async createConstraint(data: CreateConstraintDto) {
        const grant = await Grant.findById(data.grant).lean();
        if (!grant) throw new Error("Grant type not found");
        await this.validateConstraint(data);
        if (data.type === "Composition") {
            const createdComposition = await Composition.create({ ...data });
            return createdComposition;
        }
        const createdConstraint = await BaseConstraint.create({ ...data });
        return createdConstraint;
    }

    static async getConstraints(options: GetConstraintOptions = {}) {
        const filter: any = {};
        if (options.parent) {
            filter.parent = options.parent;
            return await Composition.find(filter).populate("parent").lean();
        }
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
