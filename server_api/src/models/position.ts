import mongoose, { Schema } from "mongoose";

export enum Category {
    academic = 'academic',
    administrative = 'administrative',
}
export interface IPosition extends Document {
    position_type: Category;
    title: string;
    createdAt?: Date;
    updatedAt?: Date;
}

const PositionSchema = new Schema<IPosition>({
    title: { type: String, required: true },
    position_type: {
        type: String,
        enum: Object.values(Category),
        required: true
    }
}, {
    timestamps: true
});

const Position = mongoose.model<IPosition>('Position', PositionSchema);
export default Position;
