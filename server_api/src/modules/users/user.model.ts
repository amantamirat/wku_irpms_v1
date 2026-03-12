import mongoose, { Document, Schema, Model } from 'mongoose';

import { COLLECTIONS } from '../../common/constants/collections.enum';

export enum UserStatus {
  pending = 'pending',
  active = 'active',
  suspended = 'suspended'
}

export interface IUser extends Document {
  email: string;
  password: string;
  applicant: mongoose.Types.ObjectId;
  resetCode?: String;
  resetCodeExpires?: Date;
  lastLogin?: Date,
  failedLoginAttempts: number; // Moved from optional to required for schema consistency
  lockUntil?: Date;
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
      select: false,
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
    failedLoginAttempts: {
      type: Number,
      required: true,
      default: 0,
    },
    lockUntil: {
      type: Date,
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
//UserSchema.index({ email: 1 });
export const User: Model<IUser> = mongoose.model<IUser>(COLLECTIONS.USER, UserSchema);
