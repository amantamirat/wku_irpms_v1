import mongoose, { Document, Schema, Model } from 'mongoose';
import { AuthStatus } from './auth.status';
import { COLLECTIONS } from '../../../common/constants/collections.enum';

export interface IAuth extends Document {
  email: string;
  password: string;
  user: mongoose.Types.ObjectId;
  resetCode?: String;
  resetCodeExpires?: Date;
  lastLogin?: Date,
  failedLoginAttempts?: number;
  lockUntil?: Date,
  status: AuthStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

const AuthSchema = new Schema<IAuth>(
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
    user: {
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
      enum: Object.values(AuthStatus),
      default: AuthStatus.pending,
      required: true,
    }
  },
  { timestamps: true }
);
export const Auth: Model<IAuth> = mongoose.model<IAuth>(COLLECTIONS.AUTH, AuthSchema);
