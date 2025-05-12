import mongoose, { Schema } from "mongoose";

export enum Category {
    academic = 'academic',
    supportive = 'supportive',
}
export interface IPosition extends Document {
    category: Category;
    title: string;
    createdAt?: Date;
    updatedAt?: Date;
}

const PositionSchema = new Schema<IPosition>({
    category: {
        type: String,
        enum: Object.values(Category),
        required: true
    },
    title: { type: String, required: true }
}, {
    timestamps: true
});

const Position = mongoose.model<IPosition>('Position', PositionSchema);
export default Position;
