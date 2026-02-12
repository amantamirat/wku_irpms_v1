import { Schema } from "mongoose";
import { IConstraint, Constraint, ConstraintType } from "../constraint.model";
import { ApplicantConstraintType, ApplicantConstraintValues } from "./applicant-constraint-type";

export enum OperationMode {
    COUNT = "COUNT",
    RATIO = "RATIO"
}

// Applicant Constraint Model
export interface IApplicantConstraint extends IConstraint {
    type: ConstraintType.APPLICANT;
    constraint: ApplicantConstraintType;
    mode: OperationMode; // Mode of applying the constraint (count or ratio)
}

const ApplicantConstraintSchema = new Schema<IApplicantConstraint>({
    constraint: {
        type: String,
        enum: ApplicantConstraintValues,
        required: true,
        immutable: true,
    },
    mode: {
        type: String,
        enum: Object.values(OperationMode),
        required: true,
        immutable: true,
    }

});

export const ApplicantConstraint = Constraint.discriminator<IApplicantConstraint>(ConstraintType.APPLICANT, ApplicantConstraintSchema);

