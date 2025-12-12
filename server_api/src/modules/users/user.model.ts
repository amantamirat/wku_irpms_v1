import mongoose, { Document, Schema, Model } from 'mongoose';
import { UserStatus } from './user.enum';
import { COLLECTIONS } from '../../common/constants/collections.enum';

//assumption it is auth just username and passowd
export interface IUser extends Document {
  applicant: mongoose.Types.ObjectId;
  user_name: string;
  password: string;
  email: string;
  status: UserStatus;
  roles: mongoose.Types.ObjectId[]; //remove
  organizations?: mongoose.Types.ObjectId[]; //remove
  resetCode?: String;
  resetCodeExpires?: Date;
  lastLogin?: Date,
  createdBy?: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

const UserSchema = new Schema<IUser>(
  {
    applicant: {
      type: Schema.Types.ObjectId,
      ref: COLLECTIONS.APPLICANT,
      immutable: true,
      unique: true
    },
    user_name: {
      type: String,
      //required: true,
      //unique: true,
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
    resetCode: {
      type: String
    },
    resetCodeExpires: {
      type: Date
    },
    lastLogin: {
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
