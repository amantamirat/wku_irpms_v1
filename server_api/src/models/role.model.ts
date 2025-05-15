import mongoose, { Document, Schema } from 'mongoose';
import { IPermission } from './permission.model';

export interface IRole extends Document {
  name: string;
  permissions: mongoose.Types.ObjectId[] | IPermission[];
  createdAt?: Date;
  updatedAt?: Date;
}

const RoleSchema: Schema = new Schema({
  role_name: { type: String, required: true, unique: true, },
  permissions: [{ type: Schema.Types.ObjectId, ref: 'Permission' }]
}, {
  timestamps: true,
});

export const Role = mongoose.model<IRole>('Role', RoleSchema);
