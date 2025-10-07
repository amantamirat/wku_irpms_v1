import mongoose, { model, Schema } from "mongoose";
import { ApplicantConstraintType, BaseConstraintType, ProjectConstraintType } from "./constraint.enum";
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

ProjectConstraintSchema.index({ grant: 1, constraint: 1 }, { unique: true });
export const ProjectConstraint = BaseConstraint.discriminator<IProjectConstraint>(BaseConstraintType.PROJECT, ProjectConstraintSchema);


// Applicant Constraint Model
export interface IApplicantConstraint extends IBaseConstraint {
    type: BaseConstraintType.APPLICANTS;
    constraint: ApplicantConstraintType;
    max: number; //maximum number of applicants allowed for this constraint
    min: number; //minimum number of applicants required for this constraint
}

const ApplicantConstraintSchema = new Schema<IApplicantConstraint>({
    constraint: {
        type: String,
        enum: Object.values(ApplicantConstraintType),
        required: true,
        immutable: true,
    },
    max: {
        type: Number,
        required: true
    },
    min: {
        type: Number,
        required: true
    },
});

ApplicantConstraintSchema.index({ grant: 1, constraint: 1 }, { unique: true });
export const ApplicantConstraint = BaseConstraint.discriminator<IApplicantConstraint>(BaseConstraintType.APPLICANTS, ApplicantConstraintSchema);






/*
export interface IConstraint extends Document {
    grant?: mongoose.Types.ObjectId; //
    type?: ConstraintType;
    max?: number;
    min?: number;
    parent?: mongoose.Types.ObjectId; //
    mode?: OperationMode; //
    valueType?: string;
    value?: string;  // String or ObjectIds (stored as string)    
    createdAt?: Date;
    updatedAt?: Date;
}

const ConstraintSchema = new Schema<IConstraint>(
    {
        grant: {
            type: Schema.Types.ObjectId,
            ref: COLLECTIONS.GRANT,
            //required: true,
            immutable: true,
        },
        type: {
            type: String,
            enum: Object.values(ConstraintType),
            //required: true,
            immutable: true,
        },
        max: {
            type: Number,
        },
        min: {
            type: Number,
        },
        parent: {
            type: Schema.Types.ObjectId,
            ref: COLLECTIONS.CONSTRAINT,
            immutable: true,
        },
        mode: {
            type: String,
            enum: Object.values(OperationMode),
        },
        valueType: {
            type: String,
        },
        value: {
            type: String,
        },

    },
    {
        timestamps: true
    }
);

*/

