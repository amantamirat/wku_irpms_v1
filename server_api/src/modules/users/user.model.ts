import mongoose, { Document, Schema, model } from 'mongoose';
import { COLLECTIONS } from '../../common/constants/collections.enum';
import { Unit } from '../../common/constants/enums';

export enum Gender {
    Male = 'Male',
    Female = 'Female'
}

export const userUnits = [
    Unit.department,
    Unit.external
];

export enum Accessibility {
    Visual = 'Visual',
    Hearing = 'Hearing',
    Mobility = 'Mobility',
    Speech = 'Speech',
    Cognitive = 'Cognitive',
    Other = 'Other'
}

export type UserScope =
    | mongoose.Types.ObjectId[]
    | "*"
    | null;

export interface IUser extends Document {

    workspace?: mongoose.Types.ObjectId;

    name: string;

    birthDate?: Date;

    gender?: Gender;

    fin?: string;

    orcid?: string;

    accessibility?: Accessibility[];

    specializations?: mongoose.Types.ObjectId[];

    roles: mongoose.Types.ObjectId[];

    // Authorization scope
    scope?: UserScope;

    isSystem?: boolean;

    // Audit
    createdBy?: mongoose.Types.ObjectId;

    updatedBy?: mongoose.Types.ObjectId;

    // Soft deletion
    deletedAt?: Date | null;

    deletedBy?: mongoose.Types.ObjectId | null;

    createdAt?: Date;

    updatedAt?: Date;
}


const UserSchema = new Schema<IUser>(
    {
        workspace: {
            type: Schema.Types.ObjectId,
            ref: COLLECTIONS.ORGANIZATION,
        },

        name: {
            type: String,
            required: true
        },

        birthDate: {
            type: Date,
        },

        gender: {
            type: String,
            enum: Object.values(Gender),
            default: Gender.Female
        },

        fin: {
            type: String,
            unique: true,
            match: [/^\d{12}$/, "Invalid FIN number"],
            sparse: true
        },

        orcid: {
            type: String,
            unique: true,
            sparse: true,
            match: [
                /^\d{4}-\d{4}-\d{4}-\d{4}$/,
                "Invalid ORCID format"
            ]
        },

        accessibility: {
            type: [String],
            enum: Object.values(Accessibility),
            default: []
        },

        specializations: [{
            type: Schema.Types.ObjectId,
            ref: COLLECTIONS.SPECIALIZATION
        }],

        roles: [{
            type: Schema.Types.ObjectId,
            ref: COLLECTIONS.ROLE
        }],

        scope: {
            type: Schema.Types.Mixed,
            default: null,
            validate: {
                validator: (value: unknown) => {

                    if (value === null) {
                        return true;
                    }

                    if (value === "*") {
                        return true;
                    }

                    if (Array.isArray(value)) {
                        return value.every(
                            id => mongoose.Types.ObjectId.isValid(id)
                        );
                    }

                    return false;
                },
                message:
                    'Scope must be null, "*", or an array of valid organization IDs.'
            }
        },

        isSystem: {
            type: Boolean,
            default: false
        },

        // -------------------------
        // Audit
        // -------------------------

        createdBy: {
            type: Schema.Types.ObjectId,
            ref: COLLECTIONS.USER,
        },

        updatedBy: {
            type: Schema.Types.ObjectId,
            ref: COLLECTIONS.USER,
        },

        // -------------------------
        // Soft deletion
        // -------------------------

        deletedAt: {
            type: Date,
            default: null
        },

        deletedBy: {
            type: Schema.Types.ObjectId,
            ref: COLLECTIONS.USER,
            default: null
        }
    },
    {
        timestamps: true
    }
);
UserSchema.index({ deletedAt: 1 });

const User = model<IUser>(
    COLLECTIONS.USER,
    UserSchema
);

export default User;