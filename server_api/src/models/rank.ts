import mongoose, { Document, Types, Schema } from 'mongoose';

export interface IRank extends Document {
    position: Types.ObjectId;
    rank: string;
    createdAt?: Date;
    updatedAt?: Date;
}

const RankSchema = new Schema<IRank>({
    position: {
        type: Schema.Types.ObjectId,
        ref: 'Position',
        required: true
    },
    rank: {
        type: String,
        unique: true,
        required: true
    }
}, {
    timestamps: true
});

const Rank = mongoose.model<IRank>('Rank', RankSchema);

export default Rank;

