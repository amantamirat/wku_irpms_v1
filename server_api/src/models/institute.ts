import mongoose, { model, Schema } from "mongoose";

export enum Ownership {
    public = 'public',
    private = 'private',
    NGO = 'NGO'
}

export interface IInstitute extends Document {
    name: string;
    address: {
        street?: string;
        city?: string;
        region?: string;
        country?: string;
        postal_code?: string;
    };
    sector: mongoose.Types.ObjectId;
    ownership_type: Ownership
    createdAt?: Date;
    updatedAt?: Date;
}

const InstituteSchema = new Schema<IInstitute>({
    name: { type: String, required: true },
    address: {
        street: { type: String },
        city: { type: String },
        region: { type: String },
        country: { type: String },
        postal_code: { type: String }
    },
    ownership_type: {
        type: String,
        enum: Object.values(Ownership),
        required: true
    },
    sector: {
        type: Schema.Types.ObjectId,
        ref: 'Sector',
        required: true
    },
}, {
    timestamps: true
});

export const Institute = model<IInstitute>('Institute', InstituteSchema);
