import mongoose, { Schema, Document } from 'mongoose';

export interface IPermission extends Document {
    name: string;
    description?: string;
}

const PermissionSchema: Schema = new Schema({
    name: { type: String, required: true, unique: true },
    description: { type: String }
});

export const Permission = mongoose.model<IPermission>('Permission', PermissionSchema);