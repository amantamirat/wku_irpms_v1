import mongoose, { Document, Types, Schema } from 'mongoose';

export interface IPositionStatus extends Document {
    position: Types.ObjectId;
    title: string;
    createdAt?: Date;
    updatedAt?: Date;
}

const PositionStatusSchema = new Schema<IPositionStatus>({
    position: {
        type: Schema.Types.ObjectId,
        ref: 'Position',
        required: true
    },
    title: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

const PositionStatus = mongoose.model<IPositionStatus>('PositionStatus', PositionStatusSchema);

export default PositionStatus;

