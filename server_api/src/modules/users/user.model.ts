import mongoose, { Document, Schema, Model } from 'mongoose';
import { UserStatus } from './enums/status.enum';
import { COLLECTIONS } from '../../enums/collections.enum';



export interface IUser extends Document {
  user_name: string;
  password: string;
  email?: string;
  status: UserStatus;
  roles: mongoose.Types.ObjectId[];
  reset_code?: String;
  reset_code_expires?: Date;
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
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email',
      ],
      sparse: true
    },
    status: {
      type: String,
      enum: Object.values(UserStatus),
      default: UserStatus.Pending,
      required: true,
    },
    roles: [{
      type: Schema.Types.ObjectId,
      ref: COLLECTIONS.ROLE
    }],
    reset_code: {
      type: String
    },
    reset_code_expires: {
      type: Date
    },
  },
  { timestamps: true }
);
export const User: Model<IUser> = mongoose.model<IUser>(COLLECTIONS.USER, UserSchema);
