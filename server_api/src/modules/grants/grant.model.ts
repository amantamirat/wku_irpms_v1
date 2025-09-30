import mongoose, { model, Schema } from "mongoose";
import { COLLECTIONS } from "../../enums/collections.enum";
import { Call } from "../call/call.model";

interface IGrant extends Document {
    directorate: mongoose.Types.ObjectId;
    title: string;
    description?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

const GrantSchema = new Schema<IGrant>({
    directorate: {
        type: Schema.Types.ObjectId,
        ref: COLLECTIONS.ORGAN,
        required: true,
        immutable:true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
    }
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