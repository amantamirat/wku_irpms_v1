import { model, Schema } from "mongoose";

export enum Ownership {
    public = 'public',
    private = 'private',
    NGO = 'NGO'
}
export enum Sector {
    Research = 'Research',
    Educational = 'Educational',
    Medical = 'Medical',
    Agricultural = 'Agricultural',
    Technical = 'Technical',
    Communication = 'Communication',
    Finance = 'Finance',
    Other = 'Other'
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
    sector: Sector;
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
        type: String,
        enum: Object.values(Sector),
        required: true
    }
}, {
    timestamps: true
});

export const Institute = model<IInstitute>('Institute', InstituteSchema);
