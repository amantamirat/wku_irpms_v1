import mongoose, { model, Schema } from "mongoose";
import { OperationMode, ApplicantConstraintType, ConstraintType, ProjectConstraintType } from "./constraint.enum";
import { COLLECTIONS } from "../../../util/collections.enum";

export interface IConstraint extends Document {
    grant: mongoose.Types.ObjectId;
    type: ConstraintType;
    createdAt?: Date;
    updatedAt?: Date;
}
const ConstraintSchema = new Schema<IConstraint>(
    {
        grant: {
            type: Schema.Types.ObjectId,
            ref: COLLECTIONS.GRANT,
            required: true,
            immutable: true,
        },
        type: {
            type: String,
            enum: Object.values(ConstraintType),
            required: true,
            immutable: true,
        }
    },
    {
        timestamps: true, discriminatorKey: "type"
    }
);

ConstraintSchema.index({ grant: 1, constraint: 1 }, { unique: true });
export const Constraint = model<IConstraint>(COLLECTIONS.CONSTRAINT, ConstraintSchema);


//Project Constraints Model
export interface IProjectConstraint extends IConstraint {
    type: ConstraintType.PROJECT;
    constraint: ProjectConstraintType;
    max: number;
    min: number;
}

const ProjectConstraintSchema = new Schema<IProjectConstraint>({
    constraint: {
        type: String,
        enum: Object.values(ProjectConstraintType),
        required: true,
        immutable: true,
    },
    max: {
        type: Number,
        min: 0,
        default: Number.MAX_SAFE_INTEGER, //Infinity
    },
    min: {
        type: Number,
        min: 0,
        default: 0
    },
});

ProjectConstraintSchema.index({ grant: 1, type: 1, constraint: 1 }, { unique: true });
export const ProjectConstraint = Constraint.discriminator<IProjectConstraint>(ConstraintType.PROJECT, ProjectConstraintSchema);


// Applicant Constraint Model
export interface IApplicantConstraint extends IConstraint {
    type: ConstraintType.APPLICANT;
    constraint: ApplicantConstraintType;
    mode: OperationMode; // Mode of applying the constraint (count or ratio)
}

const ApplicantConstraintSchema = new Schema<IApplicantConstraint>({
    constraint: {
        type: String,
        enum: Object.values(ApplicantConstraintType),
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



