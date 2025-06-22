import mongoose, { Schema } from "mongoose";

export enum Category {
    academic = 'academic',
    supportive = 'supportive',
    other = 'other'
}
export interface IPosition extends Document {
    category: Category;
    position_title: string;
    createdAt?: Date;
    updatedAt?: Date;
}

const PositionSchema = new Schema<IPosition>({
    category: {
        type: String,
        enum: Object.values(Category),
        required: true
    },
    position_title: {
        type: String,
        unique: true,
        required: true
    }
}, {
    timestamps: true
});

const Position = mongoose.model<IPosition>('Position', PositionSchema);
export default Position;
