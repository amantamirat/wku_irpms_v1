import mongoose, { Schema, Document } from 'mongoose';
import { COLLECTIONS } from '../../common/constants/collections.enum';

export interface IPermission extends Document {
    name: string;
    category: string;
    description?: string;
    requires?: string[];
}

const PermissionSchema: Schema = new Schema<IPermission>({
    name: { type: String, required: true, unique: true, immutable: true },
    category: { type: String, required: true },
    description: { type: String },
    requires: { type: [String], default: [] }
});

export const Permission = mongoose.model<IPermission>(
    COLLECTIONS.PERMISSION,
    PermissionSchema
);