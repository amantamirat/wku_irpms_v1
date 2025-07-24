import mongoose, { Schema, Document, Types } from 'mongoose';
// Enum for theme Types
export enum ThemeType {
    theme = 'Theme',
    priorityArea = 'Priority Area',
    subArea = 'Sub Area'    
}

export interface ITheme extends Document {    
    type: ThemeType;
    title: string;
    directorate?: Types.ObjectId;
    parent?: Types.ObjectId;
    createdAt?: Date;
    updatedAt?: Date;
}

const ThemeSchema = new Schema<ITheme>({    
    type: {
        type: String,
        enum: Object.values(ThemeType),
        required:true,
        immutable: true
    },
    title: {
        type: String,
        unique: true,
        required: true
    },
    directorate: {
        type: Schema.Types.ObjectId,
        ref: 'Organization',
        immutable: true
    },
    parent: { type: Schema.Types.ObjectId, ref: 'Theme' }

}, { timestamps: true });

ThemeSchema.pre('deleteOne', { document: true, query: false }, async function (next) {
    const themeId = this._id;
    const hasChildren = await mongoose.model('Theme').exists({ parent: themeId });
    if (hasChildren) {
        const err = new Error(`Cannot delete: ${this.title} ${this.type} it is a parent for other themes.`);
        return next(err);
    }
    next();
});

const Theme = mongoose.model<ITheme>('Theme', ThemeSchema);
export default Theme;