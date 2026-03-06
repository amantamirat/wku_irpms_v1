import mongoose from "mongoose";
import { COLLECTIONS } from "../../../../common/constants/collections.enum";

export interface IPhaseDocument extends Document {
    phase: mongoose.Types.ObjectId;
    description: string;
    documentPath: string;
    createdAt?: Date;
    updatedAt?: Date;
}

const PhaseDocSchema = new mongoose.Schema<IPhaseDocument>({
    phase: {
        type: mongoose.Schema.Types.ObjectId,
        ref: COLLECTIONS.PHASE,
        required: true,
        immutable: true
    },
    description: {
        type: String,
        required: true,
    },
    documentPath: {
        type: String,
        required: true
    }
}, { timestamps: true });

export const PhaseDocument = mongoose.model<IPhaseDocument>(COLLECTIONS.PHASE_DOCUMENT, PhaseDocSchema);
