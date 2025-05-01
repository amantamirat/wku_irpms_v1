import mongoose, { Document, Schema } from 'mongoose';

export interface IRole extends Document {
  role_name: string;
  permissions: string[];
}

const RoleSchema: Schema = new Schema({
  role_name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  permissions: {
    type: [String],
    required: true,
    default: [],
  },
}, {
  timestamps: true,
});

export default mongoose.model<IRole>('Role', RoleSchema);
