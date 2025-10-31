import mongoose, { Schema, model, Document } from 'mongoose';
import { CallStatus } from './call.enum';
import { COLLECTIONS } from '../../util/collections.enum';
import { Directorate } from '../organization/organization.model';
import { ThematicArea } from './themes/theme.model';

interface ICall extends Document {
    directorate: mongoose.Types.ObjectId;
    calendar: mongoose.Types.ObjectId;
    title: string;
    deadline: Date;
    description?: string;
    grant: mongoose.Types.ObjectId;
    theme?: mongoose.Types.ObjectId;
    status: CallStatus;
    createdAt?: Date;
    updatedAt?: Date;
}

const CallSchema = new Schema<ICall>({
    directorate: {
        type: Schema.Types.ObjectId,
        ref: Directorate.modelName,
        immutable: true,
        required: true
    },
    calendar: {
        type: Schema.Types.ObjectId,
        ref: COLLECTIONS.CALENDAR,
        immutable: true,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    deadline: {
        type: Date,
        required: true
    },
    description: {
        type: String,
    },
    grant: {
        type: Schema.Types.ObjectId,
        ref: COLLECTIONS.GRANT,
        //immutable: true,
        required: true
    },
    theme: {
        type: Schema.Types.ObjectId,
        ref: ThematicArea.modelName,
        required: true,
        //immutable: true,
    },
    status: {
        type: String,
        enum: Object.values(CallStatus),
        default: CallStatus.planned,
        required: true
    }
}, { timestamps: true });

export const Call = model<ICall>(COLLECTIONS.CALL, CallSchema);
