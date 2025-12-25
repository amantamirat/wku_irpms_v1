import mongoose, { Document, Schema } from 'mongoose';
import { COLLECTIONS } from '../../../common/constants/collections.enum';


export interface IRole extends Document {
  name: string;
  permissions: mongoose.Types.ObjectId[];
  isDefault: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const RoleSchema: Schema = new Schema<IRole>({
  name: { type: String, required: true, unique: true, },
  permissions: [{ type: Schema.Types.ObjectId, ref: COLLECTIONS.PERMISSION }],
  isDefault: {
    type: Boolean,
    default: false
  },
},
  {
    timestamps: true,
  });

export const Role = mongoose.model<IRole>(COLLECTIONS.ROLE, RoleSchema);
