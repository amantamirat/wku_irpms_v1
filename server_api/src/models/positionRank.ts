import mongoose, { Document, Types, Schema } from 'mongoose';

export interface IPositionRank extends Document {
    position: Types.ObjectId;
    rank: string;
    createdAt?: Date;
    updatedAt?: Date;
}

const PositionRankSchema = new Schema<IPositionRank>({
    position: {
        type: Schema.Types.ObjectId,
        ref: 'Position',
        required: true
    },
    rank: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

const PositionStatus = mongoose.model<IPositionRank>('PositionRank', PositionRankSchema);

export default PositionStatus;

