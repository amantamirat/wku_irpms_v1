import mongoose, { Schema, Document } from 'mongoose';
import { COLLECTIONS } from '../../../enums/collections.enum';

interface IPermission extends Document {
    name: string;
    category: string;
    description?: string;
}

const PermissionSchema: Schema = new Schema<IPermission>({
    name: { type: String, required: true, unique: true },
    category: { type: String, required: true },
    description: { type: String }
});

export const Permission = mongoose.model<IPermission>(COLLECTIONS.PERMISSION, PermissionSchema);