import mongoose from "mongoose";
import { Gender } from "../../applicants/applicant.enum";
import { Category } from "../../organization/organization.enum";
import { Grant } from "../grant.model";
import { ApplicantConstraintType, BaseConstraintType, isListConstraint, isRangeConstraint, OperationMode, ProjectConstraintType } from "./constraint.enum";
import { BaseConstraint, ProjectConstraint } from "./constraint.model";



export interface CreateProjectConstraintDto {
    type: BaseConstraintType.PROJECT;
    grant: mongoose.Types.ObjectId;
    constraint: ProjectConstraintType;
    min: number;
    max: number;
}

export interface CreateConstraintDto {
    type: BaseConstraintType;
    grant: mongoose.Types.ObjectId;
    constraint: ProjectConstraintType | ApplicantConstraintType;
    min?: number;
    max?: number;
    mode?: OperationMode;
    value?: number;
    list?: string[];
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
            if (!data.value && data.value !== 0) {
                throw new Error("Value must be specified for applicant constraints.");
            }
            if (isRangeConstraint(data.constraint as ApplicantConstraintType)) {
                if ((!data.max || !data.min)) {
                    throw new Error(`Range must be specified for ${data.constraint} constraint.`);
                }
            }
            else if (isListConstraint(data.constraint as ApplicantConstraintType)) {
                if (!data.list || data.list.length === 0) {
                    throw new Error(`List of allowed values must be specified for ${data.constraint} constraint.`);
                }

                if (data.constraint === ApplicantConstraintType.GENDER) {
                    const allowedGender = Object.values(Gender);
                    const invalidValues = data.list.filter(v => !allowedGender.includes(v as Gender));
                    if (invalidValues && invalidValues.length > 0) {
                        throw new Error(`Invalid gender value(s): ${invalidValues.join(', ')}. Allowed: ${allowedGender.join(', ')}`);
                    }
                }
                else if (data.constraint === ApplicantConstraintType.SCOPE) {
                    const allowedScopes = Object.values(Category);
                    const invalidValues = data.list.filter(v => !allowedScopes.includes(v as Category));
                    if (invalidValues && invalidValues.length > 0) {
                        throw new Error(`Invalid scope value(s): ${invalidValues.join(', ')}. Allowed: ${allowedScopes.join(', ')}`);
                    }
                }
            }
            if (data.mode === OperationMode.RATIO && data.value > 100) {
                throw new Error("Ratio value cannot exceed 100%.");
            }
            else if (data.mode === OperationMode.COUNT) {
                const participant = await ProjectConstraint.findOne({ grant: data.grant, constraint: ProjectConstraintType.PARTICIPANT }).lean();
                if (!participant) {
                    throw new Error("Applicant constraints require a corresponding Participant constraint to be set first.");
                }
                if (participant.max < data.value!) {
                    throw new Error(`Applicant constraint value cannot exceed Participant constraint max value (${participant.max}).`);
                }
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
        if (options.parent) filter.parent = options.parent;
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
