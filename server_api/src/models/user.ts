import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IUser extends Document {
  user_name: string;
  password: string;
  email?: string | null;
  //roles: mongoose.Types.ObjectId[];
  status: 'Pending' | 'Activated' | 'Suspended';
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
        'Please add a valid email',
      ],
      sparse: true, // Allow multiple nulls
      set: (v: string) => (v === "" ? null : v), // Convert empty string to null
    },
    /**
     * 
     * roles: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Role',
      },
    ],
     */
    status: {
      type: String,
      enum: ['Pending', 'Activated', 'Suspended'],
      default: 'Pending',
      required: true,
    },
  },
  { timestamps: true } // Optional: adds createdAt and updatedAt automatically
);

export const User: Model<IUser> = mongoose.model<IUser>('User', UserSchema);
