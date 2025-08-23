import mongoose, { model, Schema } from "mongoose";
import { COLLECTIONS } from "../../enums/collections.enum";
import { Call } from "../call/call.model";

interface IGrant extends Document {
    directorate: mongoose.Types.ObjectId;
    title: string;
    description?: string;
    theme: mongoose.Types.ObjectId;
    evaluation: mongoose.Types.ObjectId;
    createdAt?: Date;
    updatedAt?: Date;
}

const GrantSchema = new Schema<IGrant>({
    directorate: {
        type: Schema.Types.ObjectId,
        ref: COLLECTIONS.ORGAN,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
    },
    theme: {
        type: Schema.Types.ObjectId,
        ref: COLLECTIONS.THEME,
        required: true
    },
    evaluation: {
        type: Schema.Types.ObjectId,
        ref: COLLECTIONS.EVAL,
        required: true
    },
}, { timestamps: true });


GrantSchema.pre('deleteOne', { document: true, query: false }, async function (next) {
    const grantId = this._id;
    const isReferencedByCall = await Call.exists({ grant: grantId });
    if (isReferencedByCall) {
        const err = new Error(`Cannot delete: ${this.title} it is referenced in call.`);
        return next(err);
    }
    next();
});


export const Grant = model<IGrant>(COLLECTIONS.GRANT, GrantSchema);