import mongoose from "mongoose";
import { PhaseDocType } from "./phase.doc.enum";
import { COLLECTIONS } from "../../../../common/constants/collections.enum";

export interface IPhaseDocument extends Document {
    type: PhaseDocType;
    phase: mongoose.Types.ObjectId;
    description: string;
    documentPath: string;
    createdAt?: Date;
    updatedAt?: Date;
}

const PhaseDocSchema = new mongoose.Schema<IPhaseDocument>({
    type: {
        type: String,
        enum: Object.values(PhaseDocType),
        required: true,
        immutable: true
    },
    phase: {
        type: mongoose.Schema.Types.ObjectId,
        ref: COLLECTIONS.PHASE,
        required: true
    },
    description: {
        type: String
    },
    documentPath: {
        type: String,
        required: true
    }
}, { timestamps: true });

export const PhaseDocument = mongoose.model<IPhaseDocument>(COLLECTIONS.PHASE_DOCUMENT, PhaseDocSchema);
