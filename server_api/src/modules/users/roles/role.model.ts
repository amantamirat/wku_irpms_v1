import mongoose, { Document, Schema } from 'mongoose';
import { COLLECTIONS } from '../../../enums/collections.enum';


export interface IRole extends Document {
  role_name: string;
  permissions: mongoose.Types.ObjectId[];
  createdAt?: Date;
  updatedAt?: Date;
}

const RoleSchema: Schema = new Schema<IRole>({
  role_name: { type: String, required: true, unique: true, },
  permissions: [{ type: Schema.Types.ObjectId, ref: COLLECTIONS.PERMISSION }]
},
  {
    timestamps: true,
  });

export const Role = mongoose.model<IRole>(COLLECTIONS.ROLE, RoleSchema);
