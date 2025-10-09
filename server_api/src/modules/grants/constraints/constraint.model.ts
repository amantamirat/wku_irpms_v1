import mongoose, { model, Schema } from "mongoose";
import { OperationMode, ApplicantConstraintType, BaseConstraintType, ProjectConstraintType } from "./constraint.enum";
import { COLLECTIONS } from "../../../enums/collections.enum";

export interface IBaseConstraint extends Document {
    grant: mongoose.Types.ObjectId;
    type: BaseConstraintType;
    createdAt?: Date;
    updatedAt?: Date;
}
const BaseConstraintSchema = new Schema<IBaseConstraint>(
    {
        grant: {
            type: Schema.Types.ObjectId,
            ref: COLLECTIONS.GRANT,
            required: true,
            immutable: true,
        },
        type: {
            type: String,
            enum: Object.values(BaseConstraintType),
            required: true,
            immutable: true,
        }
    },
    {
        timestamps: true, discriminatorKey: "type"
    }
);

export const BaseConstraint = model<IBaseConstraint>(COLLECTIONS.CONSTRAINT, BaseConstraintSchema);

//Project Constraints Model
export interface IProjectConstraint extends IBaseConstraint {
    type: BaseConstraintType.PROJECT;
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
export const ProjectConstraint = BaseConstraint.discriminator<IProjectConstraint>(BaseConstraintType.PROJECT, ProjectConstraintSchema);


// Applicant Constraint Model
export interface IApplicantConstraint extends IBaseConstraint {
    type: BaseConstraintType.APPLICANT;
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

ApplicantConstraintSchema.index({ grant: 1, type: 1, constraint: 1 }, { unique: true });
export const ApplicantConstraint = BaseConstraint.discriminator<IApplicantConstraint>(BaseConstraintType.APPLICANT, ApplicantConstraintSchema);


// Composition Constraint Model
export interface ICompositionConstraint extends IBaseConstraint {
    type: BaseConstraintType.COMPOSITION;
    parent: mongoose.Types.ObjectId;
    value: number; // Required number or ratio of applicants
    max?: number; // value for range-based constraints
    min?: number; // value for range-based constraints
    item?: string; // Allowed values for enum-based constraints
}


const CompositionConstraintSchema = new Schema<ICompositionConstraint>({
    parent: {
        type: Schema.Types.ObjectId,
        ref: ApplicantConstraint.modelName,
        required: true,
        immutable: true
    },
    value: {
        type: Number,
        required: true
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
    item: {
        type: String,
    }
});

export const CompositionConstraint = BaseConstraint.discriminator<ICompositionConstraint>(BaseConstraintType.COMPOSITION, CompositionConstraintSchema);


