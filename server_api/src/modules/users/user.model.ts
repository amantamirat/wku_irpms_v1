import mongoose, { Document, Schema, Model } from 'mongoose';
import { UserStatus } from './user.enum';
import { COLLECTIONS } from '../../util/collections.enum';

export interface IUser extends Document {
  user_name: string;
  password: string;
  email: string;
  status: UserStatus;
  roles: mongoose.Types.ObjectId[];
  organizations?: mongoose.Types.ObjectId[];
  reset_code?: String;
  reset_code_expires?: Date;
  createdBy?: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

const UserSchema = new Schema<IUser>(
  {
    user_name: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      unique: true,
      required: true,
      immutable: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email',
      ]
    },
    status: {
      type: String,
      enum: Object.values(UserStatus),
      default: UserStatus.pending,
      required: true,
    },
    roles: [{
      type: Schema.Types.ObjectId,
      ref: COLLECTIONS.ROLE
    }],
    organizations: [{
      type: Schema.Types.ObjectId,
      ref: COLLECTIONS.ORGANIZATION
    }],
    reset_code: {
      type: String
    },
    reset_code_expires: {
      type: Date
    },        
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: COLLECTIONS.USER,
      immutable: true
    },
  },
  { timestamps: true }
);
export const User: Model<IUser> = mongoose.model<IUser>(COLLECTIONS.USER, UserSchema);
