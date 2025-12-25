import mongoose, { Document, Schema, Model } from 'mongoose';
import { UserStatus } from './user.status';
import { COLLECTIONS } from '../../common/constants/collections.enum';

//assumption it is auth just username and passowd
export interface IUser extends Document {
  email: string;
  password: string;
  applicant: mongoose.Types.ObjectId;
  resetCode?: String;
  resetCodeExpires?: Date;
  lastLogin?: Date,
  status: UserStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

const UserSchema = new Schema<IUser>(
  {
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
    password: {
      type: String,
      required: true,
    },
    applicant: {
      type: Schema.Types.ObjectId,
      ref: COLLECTIONS.APPLICANT,
      immutable: true,
      unique: true
    },
    resetCode: {
      type: String
    },
    resetCodeExpires: {
      type: Date
    },
    lastLogin: {
      type: Date
    },
    status: {
      type: String,
      enum: Object.values(UserStatus),
      default: UserStatus.pending,
      required: true,
    }
  },
  { timestamps: true }
);
export const User: Model<IUser> = mongoose.model<IUser>(COLLECTIONS.USER, UserSchema);
